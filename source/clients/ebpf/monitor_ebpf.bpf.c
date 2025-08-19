#include "vmlinux_complete.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>

// Ring buffer map for sending events to userspace
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024); // 256KB ring buffer
} icmp_events SEC(".maps");

// Event structure sent to userspace
struct icmp_event {
    __u32 src_ip;
    __u32 dst_ip;
    __u8 icmp_type;
    __u8 icmp_code;
    __u64 timestamp;
};

SEC("xdp")
int icmp_monitor(struct xdp_md *ctx)
{
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;
    
    // Parse Ethernet header
    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end)
        return XDP_PASS;
    
    // Only process IPv4 packets
    if (bpf_ntohs(eth->h_proto) != 0x0800) // ETH_P_IP
        return XDP_PASS;
    
    // Parse IP header
    struct iphdr *ip = (void *)(eth + 1);
    if ((void *)(ip + 1) > data_end)
        return XDP_PASS;
    
    // Only process ICMP packets
    if (ip->protocol != 1) // IPPROTO_ICMP
        return XDP_PASS;
    
    // Parse ICMP header
    struct icmphdr *icmp = (void *)ip + (ip->ihl * 4);
    if ((void *)(icmp + 1) > data_end)
        return XDP_PASS;
    
    // Reserve space in ring buffer
    struct icmp_event *event;
    event = bpf_ringbuf_reserve(&icmp_events, sizeof(*event), 0);
    if (!event)
        return XDP_PASS;
    
    // Fill event data (keep network byte order, convert in userspace)
    event->src_ip = ip->saddr;
    event->dst_ip = ip->daddr;
    event->icmp_type = icmp->type;
    event->icmp_code = icmp->code;
    event->timestamp = bpf_ktime_get_ns();
    
    // Submit event to userspace
    bpf_ringbuf_submit(event, 0);
    
    return XDP_PASS; // Let packet continue normal processing
}

char _license[] SEC("license") = "GPL";