#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <signal.h>
#include <arpa/inet.h>
#include <bpf/libbpf.h>
#include <bpf/bpf.h>

// Must match kernel structure
struct icmp_event {
    __u32 src_ip;
    __u32 dst_ip;
    __u8 icmp_type;
    __u8 icmp_code;
    __u64 timestamp;
};

static volatile int keep_running = 1;

void signal_handler(int sig) {
    (void)sig;
    keep_running = 0;
}

void ip_to_string(__u32 ip, char *buffer) {
    // IP is already in correct format from eBPF, just extract bytes
    sprintf(buffer, "%d.%d.%d.%d",
            ip & 0xFF,
            (ip >> 8) & 0xFF,
            (ip >> 16) & 0xFF,
            (ip >> 24) & 0xFF);
}

int handle_event(void *ctx, void *data, size_t data_sz) {
    (void)ctx;
    (void)data_sz;
    
    struct icmp_event *event = data;
    char src_ip_str[16], dst_ip_str[16];
    
    ip_to_string(event->src_ip, src_ip_str);
    ip_to_string(event->dst_ip, dst_ip_str);
    
    // Output JSON for Python parsing
    printf("{\"src_ip\":\"%s\",\"dst_ip\":\"%s\",\"icmp_type\":%d,\"icmp_code\":%d,\"timestamp\":%llu}\n",
           src_ip_str, dst_ip_str, event->icmp_type, event->icmp_code, event->timestamp);
    
    fflush(stdout);
    return 0;
}

int main(int argc, char **argv) {
    struct ring_buffer *rb = NULL;
    int map_fd;
    int err = 0;
    char map_path[] = "/sys/fs/bpf/monitor_events";
    
    if (argc > 1) {
        fprintf(stderr, "Usage: %s\n", argv[0]);
        fprintf(stderr, "This program reads ICMP events from pinned bpffs ring buffer\n");
        fprintf(stderr, "Make sure monitor_ebpf_loader is running first as root\n");
        return 1;
    }
    
    // Set up signal handlers
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);
    
    // Set libbpf logging to suppress info messages
    libbpf_set_print(NULL);
    
    fprintf(stderr, "🔗 Opening pinned ring buffer from %s...\n", map_path);
    
    // Open the pinned ring buffer map
    map_fd = bpf_obj_get(map_path);
    if (map_fd < 0) {
        fprintf(stderr, "❌ Failed to open pinned map %s: %s\n", map_path, strerror(-map_fd));
        fprintf(stderr, "💡 Make sure:\n");
        fprintf(stderr, "   1. monitor_ebpf_loader is running as root\n");
        fprintf(stderr, "   2. bpffs is mounted at /sys/fs/bpf\n");
        fprintf(stderr, "   3. You have read permissions on the pinned map\n");
        return 1;
    }
    
    // Set up ring buffer
    rb = ring_buffer__new(map_fd, handle_event, NULL, NULL);
    if (!rb) {
        fprintf(stderr, "❌ Failed to create ring buffer\n");
        err = 1;
        goto cleanup;
    }
    
    fprintf(stderr, "✅ eBPF ICMP reader started (press Ctrl+C to stop)\n");
    
    // Main event loop
    while (keep_running) {
        int ret = ring_buffer__poll(rb, 100); // 100ms timeout
        if (ret == -EINTR) {
            break;
        }
        if (ret < 0 && ret != -EAGAIN) {
            fprintf(stderr, "❌ Error polling ring buffer: %s\n", strerror(-ret));
            break;
        }
    }
    
    fprintf(stderr, "🛑 Shutting down eBPF ICMP reader\n");
    
cleanup:
    if (rb) {
        ring_buffer__free(rb);
    }
    if (map_fd >= 0) {
        close(map_fd);
    }
    
    return err;
}