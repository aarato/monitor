# Monitor
Web based application for real-time monitoring

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