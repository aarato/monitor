# eBPF Network Monitoring

Advanced network packet monitoring using eBPF (extended Berkeley Packet Filter) with XDP (eXpress Data Path) for high-performance ICMP packet capture.

## Overview

This eBPF implementation provides kernel-level packet filtering and userspace data forwarding for real-time network monitoring. It captures ICMP packets at the network interface level and forwards them to the monitoring client via stdout.

## Components

### 1. eBPF Kernel Program (`monitor_ebpf.bpf.c`)
- **Purpose**: Kernel-space XDP program that filters ICMP packets
- **Attachment**: Attaches to network interface (e.g., eth0)
- **Output**: Sends packet data to userspace via ring buffer

### 2. eBPF Loader (`monitor_ebpf_loader.c`)
- **Purpose**: Privileged program that loads eBPF into kernel
- **Requirements**: Must run as root
- **Function**: Compiles, loads, and pins eBPF program to bpffs

### 3. eBPF Reader (`monitor_ebpf_reader.c`)
- **Purpose**: Userspace program that reads from eBPF ring buffer
- **Output**: JSON formatted ICMP packet data to stdout
- **Usage**: Pipes data to monitor client

## Prerequisites

### System Requirements
- **Linux Kernel**: 5.4+ with eBPF support
- **Root Access**: Required for eBPF loading and network interface access
- **BPF Filesystem**: `/sys/fs/bpf` mounted

### Dependencies
```bash
# Ubuntu/Debian
sudo apt install libbpf-dev clang llvm

# RHEL/CentOS
sudo yum install libbpf-devel clang llvm
```

### Build Tools
```bash
# Install build essentials
sudo apt install build-essential linux-headers-$(uname -r)
```

## Installation & Setup

### 1. Build eBPF Programs
```bash
cd source/clients/ebpf
make -f Makefile.clean
```

### 2. Load eBPF Program (as root)
```bash
# Load and attach to network interface
sudo ./monitor_ebpf_loader eth0
```

Expected output:
```
eBPF program loaded successfully
Attached to interface: eth0
Map pinned to: /sys/fs/bpf/monitor_events
```

### 3. Start Reader and Monitor Client
```bash
# In one terminal - read eBPF data and forward to backend
sudo ./monitor_ebpf_reader | \
  CLIENTNAME="NetworkPackets" \
  URL=http://localhost:5000 \
  PASSWORD=secret123 \
  node ../monitor_client.js
```

## Usage Examples

### Basic Network Monitoring
```bash
# Terminal 1: Start backend
cd ../../backend
PORT=5000 PASSWORD=secret123 npm start

# Terminal 2: Start frontend  
cd ../../frontend
npm run dev

# Terminal 3: Load eBPF and start monitoring
cd source/clients/ebpf
sudo ./monitor_ebpf_loader eth0
sudo ./monitor_ebpf_reader | CLIENTNAME="ICMP" URL=http://localhost:5000 PASSWORD=secret123 node ../monitor_client.js

# Terminal 4: Generate ICMP traffic
ping google.com
```

### Multi-Interface Monitoring
```bash
# Monitor multiple network interfaces
sudo ./monitor_ebpf_loader eth0
sudo ./monitor_ebpf_reader | CLIENTNAME="eth0-ICMP" URL=http://localhost:5000 node ../monitor_client.js &

sudo ./monitor_ebpf_loader wlan0  
sudo ./monitor_ebpf_reader | CLIENTNAME="wlan0-ICMP" URL=http://localhost:5000 node ../monitor_client.js &
```

## Data Format

### eBPF Output (JSON)
```json
{
  "src_ip": "192.168.1.100",
  "dst_ip": "8.8.8.8", 
  "icmp_type": 8,
  "icmp_code": 0,
  "timestamp": 1692123456789
}
```

### Monitor Client Formatting
```
ICMP Echo Request from 192.168.1.100 to 8.8.8.8 (code: 0)
```

## Troubleshooting

### Permission Issues
```bash
# Ensure BPF filesystem is mounted
sudo mount -t bpf bpf /sys/fs/bpf

# Check if running as root
whoami  # Should return 'root'
```

### Build Errors
```bash
# Missing headers
sudo apt install linux-headers-$(uname -r)

# Missing libbpf
sudo apt install libbpf-dev

# Clean and rebuild
make -f Makefile.clean clean && make -f Makefile.clean
```

### Runtime Issues

**XDP program already attached:**
```
Error: XDP program already attached to interface
```
→ The loader automatically detaches existing programs

**No ICMP packets captured:**
```bash
# Verify eBPF program is loaded
sudo bpftool prog list

# Check interface traffic
sudo tcpdump -i eth0 icmp

# Generate test traffic
ping 8.8.8.8
```

**Ring buffer read errors:**
```bash
# Check BPF map permissions
ls -la /sys/fs/bpf/monitor_events

# Should show 666 permissions for user access
```

## Architecture

```
Network Interface (eth0)
         ↓ XDP hook
   eBPF Kernel Program (monitor_ebpf.bpf.c)
         ↓ Ring buffer
   eBPF Reader (monitor_ebpf_reader.c)  
         ↓ JSON stdout
   Monitor Client (monitor_client.js)
         ↓ Socket.IO  
   Backend Server → Web Dashboard
```

## Security Considerations

- **Root Privileges**: eBPF loading requires root access
- **Network Access**: Captures all ICMP traffic on interface
- **Privilege Separation**: Only loader runs as root, reader can run as user
- **Data Filtering**: Only ICMP packets are captured and forwarded

## Performance

- **High Performance**: XDP processes packets at kernel level
- **Low Overhead**: Minimal CPU impact compared to userspace packet capture
- **Scalable**: Can handle high packet rates without dropping data
- **Efficient**: Direct kernel-to-userspace communication via ring buffer

## Files

- `monitor_ebpf.bpf.c` - eBPF kernel program source
- `monitor_ebpf_loader.c` - eBPF loader (privileged)
- `monitor_ebpf_reader.c` - Ring buffer reader (unprivileged)
- `vmlinux_complete.h` - Kernel headers for eBPF compilation
- `Makefile.clean` - Build configuration

## Integration

This eBPF monitoring integrates with the main monitoring system:

1. **Data Source**: eBPF captures network packets
2. **Data Pipeline**: Reader → Monitor Client → Backend → Frontend
3. **Web Interface**: Real-time packet data displayed in browser
4. **Room Management**: Join "NetworkPackets" room to view data

## License

ISC