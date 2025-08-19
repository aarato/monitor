#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <signal.h>
#include <net/if.h>
#include <sys/socket.h>
#include <linux/if_link.h>
#include <bpf/libbpf.h>
#include <bpf/bpf.h>
#include <sys/mount.h>
#include <sys/stat.h>

static volatile int keep_running = 1;

void signal_handler(int sig) {
    (void)sig;
    keep_running = 0;
}

int ensure_bpffs_mounted() {
    struct stat st;
    
    // Check if /sys/fs/bpf exists
    if (stat("/sys/fs/bpf", &st) == -1) {
        if (mkdir("/sys/fs/bpf", 0755) == -1 && errno != EEXIST) {
            fprintf(stderr, "Failed to create /sys/fs/bpf directory: %s\n", strerror(errno));
            return -1;
        }
    }
    
    // Check if bpffs is already mounted
    if (mount(NULL, "/sys/fs/bpf", "bpf", MS_REMOUNT, NULL) == 0) {
        // Already mounted
        return 0;
    }
    
    // Try to mount bpffs
    if (mount("bpf", "/sys/fs/bpf", "bpf", 0, NULL) == -1) {
        // Not fatal - might already be mounted differently
        fprintf(stderr, "Warning: Could not mount bpffs: %s\n", strerror(errno));
    }
    
    return 0;
}

int main(int argc, char **argv) {
    struct bpf_object *obj;
    struct bpf_program *prog;
    struct bpf_link *link = NULL;
    int map_fd;
    int ifindex;
    int err = 0;
    char map_path[] = "/sys/fs/bpf/monitor_events";
    
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <interface>\n", argv[0]);
        fprintf(stderr, "This program loads eBPF and pins ring buffer to bpffs\n");
        fprintf(stderr, "Run as: sudo %s eth0\n", argv[0]);
        return 1;
    }
    
    // Check if running as root
    if (getuid() != 0) {
        fprintf(stderr, "Error: This program must run as root to load eBPF programs\n");
        fprintf(stderr, "Run as: sudo %s %s\n", argv[0], argv[1]);
        return 1;
    }
    
    // Get interface index
    ifindex = if_nametoindex(argv[1]);
    if (ifindex == 0) {
        fprintf(stderr, "Invalid interface: %s\n", argv[1]);
        return 1;
    }
    
    // Set up signal handlers
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);
    
    // Ensure bpffs is mounted
    if (ensure_bpffs_mounted() < 0) {
        return 1;
    }
    
    // Set libbpf logging
    libbpf_set_print(NULL);
    
    printf("🚀 Loading eBPF ICMP monitor on interface %s...\n", argv[1]);
    
    // Load eBPF object file
    obj = bpf_object__open_file("monitor_ebpf.bpf.o", NULL);
    if (libbpf_get_error(obj)) {
        fprintf(stderr, "❌ Failed to open eBPF object file monitor_ebpf.bpf.o\n");
        fprintf(stderr, "💡 Build first: make -f Makefile.clean monitor_ebpf\n");
        return 1;
    }
    
    // Load eBPF program into kernel
    err = bpf_object__load(obj);
    if (err) {
        fprintf(stderr, "❌ Failed to load eBPF object: %s\n", strerror(-err));
        goto cleanup;
    }
    
    // Find the XDP program
    prog = bpf_object__find_program_by_name(obj, "icmp_monitor");
    if (!prog) {
        fprintf(stderr, "❌ Failed to find eBPF program 'icmp_monitor'\n");
        err = 1;
        goto cleanup;
    }
    
    // Attach XDP program to interface with force flag (replaces existing)
    link = bpf_program__attach_xdp(prog, ifindex);
    if (libbpf_get_error(link)) {
        fprintf(stderr, "⚠️  Failed to attach XDP program to interface %s\n", argv[1]);
        fprintf(stderr, "💡 Trying to detach existing XDP program first...\n");
        
        // Try to detach any existing XDP program using bpf_set_link_xdp_fd
        if (bpf_set_link_xdp_fd(ifindex, -1, 0) == 0) {
            printf("✅ Detached existing XDP program\n");
            
            // Try to attach again
            link = bpf_program__attach_xdp(prog, ifindex);
            if (libbpf_get_error(link)) {
                fprintf(stderr, "❌ Still failed to attach XDP program after detaching existing one\n");
                err = 1;
                goto cleanup;
            }
            printf("✅ Successfully attached XDP program after detaching previous one\n");
        } else {
            fprintf(stderr, "❌ Failed to detach existing XDP program\n");
            fprintf(stderr, "💡 Try manually: sudo bpftool net detach xdp dev %s\n", argv[1]);
            err = 1;
            goto cleanup;
        }
    }
    
    // Get ring buffer map
    map_fd = bpf_object__find_map_fd_by_name(obj, "icmp_events");
    if (map_fd < 0) {
        fprintf(stderr, "❌ Failed to find ring buffer map 'icmp_events'\n");
        err = 1;
        goto cleanup;
    }
    
    // Remove existing pinned map if it exists
    unlink(map_path);
    
    // Pin the ring buffer map to bpffs
    err = bpf_obj_pin(map_fd, map_path);
    if (err) {
        fprintf(stderr, "❌ Failed to pin ring buffer to %s: %s\n", map_path, strerror(-err));
        goto cleanup;
    }
    
    // Set permissions so any user can read and write BPF maps (666)
    if (chmod(map_path, 0666) == -1) {
        fprintf(stderr, "⚠️  Warning: Could not set permissions on %s: %s\n", map_path, strerror(errno));
    }
    
    printf("✅ eBPF program loaded and attached to %s\n", argv[1]);
    printf("✅ Ring buffer pinned to %s\n", map_path);
    printf("✅ Ready for Node.js readers to connect\n");
    printf("💡 Start reader with: node monitor_ebpf_reader.js\n");
    printf("🛑 Press Ctrl+C to stop and cleanup\n\n");
    
    // Keep program running to maintain eBPF attachment
    while (keep_running) {
        sleep(1);
    }
    
    printf("🧹 Cleaning up eBPF loader...\n");
    
    // Unpin the map
    if (unlink(map_path) == 0) {
        printf("✅ Unpinned ring buffer\n");
    }
    
cleanup:
    if (link) {
        bpf_link__destroy(link);
        printf("✅ Detached XDP program\n");
    }
    if (obj) {
        bpf_object__close(obj);
    }
    
    return err;
}