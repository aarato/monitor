# Monitor Client

A lightweight, generic monitoring client that sends real-time data from any source to web browsers via a Socket.IO backend.

## Overview

The Monitor Client reads data from stdin (via pipes) and forwards it to web browsers through a Socket.IO backend server. It's designed to be simple, fast, and work with any data source.

## Quick Start

### Prerequisites

1. **Backend Server**: Ensure your Socket.IO backend is running
2. **Node.js**: Version 14+ required

### Installation

```bash
npm install
```

### Basic Usage

**Send a simple message:**
```bash
echo "Hello World" | node monitor_client.js
```

**With backend configuration:**
```bash
echo "System Alert!" | URL=http://localhost:5000 PASSWORD=mypassword node monitor_client.js
```

**Send JSON data:**
```bash
echo '{"message":"Database connection restored","level":"info"}' | URL=http://localhost:5000 node monitor_client.js
```

**Send multiple messages:**
```bash
printf "Message 1\nMessage 2\nMessage 3\n" | URL=http://localhost:5000 node monitor_client.js
```

## Configuration

Configure the client using environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `URL` | `http://localhost` | Backend Socket.IO server URL |
| `PASSWORD` | `null` | Authentication password for backend |
| `CLIENTNAME` | `Monitor` | Client identifier (appears in web interface) |
| `MAX_MESSAGES_PER_SECOND` | `10` | Rate limiting (messages per second) |

### Examples

**Custom client name:**
```bash
echo "CPU usage: 85%" | CLIENTNAME="ServerMonitor" node monitor_client.js
```

**Different backend server:**
```bash
echo "Hello" | URL=https://monitor.company.com PASSWORD=secret123 node monitor_client.js
```

**Rate limiting:**
```bash
# Limit to 5 messages per second
echo "High frequency data" | MAX_MESSAGES_PER_SECOND=5 node monitor_client.js
```

## Data Types

The Monitor Client automatically detects and formats different data types:

### Plain Text
```bash
echo "Server is running normally" | node monitor_client.js
```
→ Sent as-is to web browsers

### JSON Data

**Generic JSON with message field:**
```bash
echo '{"message":"User login successful","user":"john"}' | node monitor_client.js
```
→ Extracts and sends the message field

**ICMP Network Data:**
```bash
echo '{"src_ip":"192.168.1.1","dst_ip":"8.8.8.8","icmp_type":8,"icmp_code":0}' | node monitor_client.js
```
→ Formatted as: "ICMP Echo Request from 192.168.1.1 to 8.8.8.8 (code: 0)"

**HTTP Request Data:**
```bash
echo '{"method":"GET","url":"/api/users","status":200,"client_ip":"10.0.1.5"}' | node monitor_client.js
```
→ Formatted as: "HTTP GET /api/users 200 from 10.0.1.5"

**Unknown JSON:**
```bash
echo '{"temperature":22.5,"humidity":65,"location":"server_room"}' | node monitor_client.js
```
→ Sent as stringified JSON

## Integration Examples

### System Monitoring
```bash
# CPU usage monitoring
while true; do
  echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')"
  sleep 5
done | CLIENTNAME="SystemMonitor" node monitor_client.js
```

### Log File Monitoring
```bash
# Monitor application logs
tail -f /var/log/myapp.log | CLIENTNAME="AppLogs" node monitor_client.js
```

### Custom Scripts
```bash
# Custom monitoring script
./my_monitoring_script.sh | CLIENTNAME="CustomMonitor" node monitor_client.js
```

### Network Monitoring
```bash
# Network packet monitoring
ping -c 1 8.8.8.8 | grep "time=" | CLIENTNAME="NetworkMonitor" node monitor_client.js
```

## Rate Limiting

The client includes built-in rate limiting to prevent overwhelming the backend:

- **Default**: 10 messages per second
- **Overflow behavior**: Drops excess messages and sends notification
- **Configurable**: Set `MAX_MESSAGES_PER_SECOND` environment variable

**Rate limit messages:**
```
⚠️ [ClientName] Rate limit reached (10/sec), dropping messages...
⚠️ [ClientName] Rate limit exceeded: 15 messages dropped in the last second
```

## Backend Integration

### Authentication

The client supports password authentication:

```bash
echo "data" | PASSWORD=your_secret_password node monitor_client.js
```

The password is hashed using SHA-256 before transmission.

### Room Joining

The client automatically:
1. Connects to the Socket.IO server
2. Waits for successful connection
3. Waits for room joining to complete
4. Only then starts processing stdin data

This ensures no data is lost during the connection process.

## Troubleshooting

### Connection Issues

**Backend not running:**
```
⚠️ Socket.IO connection failed: Error: xhr poll error, proceeding anyway...
```
→ Check if backend server is running and accessible

**Authentication failed:**
```
❌ Socket.IO connection error: Invalid token
```
→ Check if PASSWORD matches backend configuration

### Usage Issues

**No input data:**
```
❌ This program reads from stdin (piped input)
💡 Usage: <data_source> | node monitor_client.js
```
→ Make sure to pipe data into the client

**Rate limiting active:**
```
⚠️ [Monitor] Rate limit reached (10/sec), dropping messages...
```
→ Reduce input frequency or increase `MAX_MESSAGES_PER_SECOND`

## Files

- `monitor_client.js` - Main client program
- `socket_client.js` - Socket.IO client factory
- `log.js` - Logging utilities
- `package.json` - Dependencies and configuration

## License

ISC