# Monitor
Real-time network monitoring web application that displays live ICMP and HTTP(S) traffic with source IP geolocation for diagnostic purposes.

## How It Works

This application creates a web-based dashboard that shows incoming network traffic in real-time. It consists of three main components:

### Use Cases
- **Network Diagnostics**: See who is pinging your servers and from where
- **Security Monitoring**: Track unusual traffic patterns or sources
- **Performance Analysis**: Monitor HTTP response times and availability
- **Geographic Analysis**: Understand the geographic distribution of your traffic


### Data Flow - ICMP Monitoring

```
Client 1 (Ping Source)              Client 2 (Web Monitor)
──────────────────────             ───────────────────────

    ┌─────────┐                        ┌─────────────┐
    │  ping   │                        │     Web     │
    │ client  │                        │   Browser   │
    │         │                        │ ┌────────┐  │     
    │         │                        │ │Live    │  │     
    │         │                        │ │Chart   │  │     
    └────┬────┘                        │ │Geo-Loc.│  │     
         │                             │ └────────┘  │     
         │                             │      ▲      │
         │                             └───── │ ─────┘     
         │  ICMP ping                         │  WebSocket 
         │                                    │ (Socket.IO)
         │                                    │            
┌─────── │ ───────┐                 ┌──────── │ ──────────┐
│        ▼        │                 │         │           │
│  ┌───────────┐  │                 │  ┌───────────────┐  │ 
│  │ iptables  │  │                 │  │ WebSocket     │  │ 
│  │   RULE    │  │                 │  │ Broadcaster   │  │ 
│  │LOG PREFIX │  │                 │  │ + GeoIP       │  │
│  │"IPT_ICMP" │  │                 │  └───────────────┘  │
│  └───────────┘  │                 │          ▲          │
│        │        │                 │          │          │
│        ▼        │   syslog UDP    │  ┌───────────────┐  │
│  ┌───────────┐  │    port 5514    │  │ NodeJS Syslog │  │
│  │  rsyslog  │  │────────────────▶│  │    Server     │  │
│  │  daemon   │  │                 │  │ (port 5514)   │  │
│  └───────────┘  │                 │  └───────────────┘  │ 
│  Linux Kernel   │                 │     Application     │
└─────────────────┘                 └─────────────────────┘                 

Flow Steps:
1. Client 1 sends ICMP ping to monitored server
2. Linux kernel iptables rule matches and generates log entry with "IPT_ICMP" prefix  
3. rsyslog daemon forwards log to syslog server component on UDP port 5514
4. Syslog server component receives log and uses WebSocket (Socket.IO) to send to server
5. Server component performs GeoIP lookup and broadcasts to connected web GUI clients
6. Client 2 web browser displays real-time ICMP activity with source IP geolocation from Client 1
```


# Setup
The setup script will work on Ubuntu 22.04 linux computers.
```
curl -s https://raw.githubusercontent.com/aarato/monitor/main/setup.sh | bash
```
# Firewall and Syslog Setup
The program will monitor incoming ICMP packets by logging iptables logs with rsyslog and sending them rate limited to one of the programs on port 5514 or whatever is configured as an option
```
sudo iptables -I INPUT 1 -p icmp \
  -m limit --limit 10/second --limit-burst 10 \
  -j LOG --log-prefix "IPT_ICMP " --log-level info
```
Create /etc/rsyslog.d/30-icmp-remote.conf (replace 10.0.0.5 with your server):
```
# Forward iptables ICMP logs to a remote syslog server on UDP/5514.
# This matches the iptables LOG prefixes above.

if ($programname == "kernel" and ($msg contains "IPT_ICMP " or $msg contains "IPT_ICMP6 ")) then {
    action(type="omfwd" target="10.0.0.5" port="5514" protocol="udp")
    stop
}
```