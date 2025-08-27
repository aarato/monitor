# Real-time Monitoring System

A complete real-time monitoring solution that streams data from any source to web browsers. Send data from servers, applications, network devices, or custom scripts directly to a live web dashboard.

## What It Does

The monitoring system creates a real-time data pipeline:

```
Data Source —→ Monitor Client —————————→ Backend Server —→ Web Dashboard
     ↓                ↓                       ↓                  ↓
  Any program    Node.js/Python         Socket.IO         Vue.js web app
  that outputs   stdin readers          server with       with real-time
  text/JSON      with rate limiting     authentication    charts and
                 and authentication     and rooms         room management
```

**Key Features:**
- **Universal Input**: Accept data from any source via stdin
- **Real-time Streaming**: Instant data delivery to web browsers  
- **Multiple Data Sources**: Support for text, JSON, and structured data
- **Room Management**: Organize data streams by client/purpose
- **Rate Limiting**: Built-in protection against data floods
- **Authentication**: Secure client connections with password protection
- **Geographic Info**: IP geolocation for connected clients
- **Interactive Charts**: Live data visualization
- **Responsive Design**: Works on desktop and mobile
- **IP Lookup**: Built-in IP geolocation lookup tool
- **Real-time Filtering**: Regex-based filtering of log streams
- **Docker Support**: Containerized deployment with automated builds

## Quick Start

### Step 1: Start Server Components with Docker

```bash
# Set MaxMind credentials (get free account at https://www.maxmind.com/en/geolite2/signup)
export MAXMIND_ACCOUNT_ID=your_account_id
export MAXMIND_LICENSE_KEY=your_license_key

# Start backend and frontend services
docker-compose up -d
```

### Step 2: Send Data from Monitor Client

**Option A: Node.js Client**
```bash
cd source/clients
npm install

echo "Hello from Node.js client" | \
  URL=http://localhost \
  PASSWORD=Test123 \
  CLIENTNAME="NodeClient" \
  node monitor_client.js
```

**Option B: Python Client**  
```bash
cd source/clients
pip3 install -r requirements.txt

cat | URL=http://localhost PASSWORD=Test123 CLIENTNAME=PythonClient python3 monitor_client.py
# Type messages and press Enter, Ctrl+C to exit
```

### Step 3: View in Web Browser

1. Open http://localhost
2. Click "Settings" (⚙️) → Join "NodeClient" or "PythonClient" room  
3. See real-time messages appear in the dashboard

## Advanced Examples

### Multiple Data Sources

**Node.js Client - Server Monitoring:**
```bash
while true; do
  echo "CPU: $(shuf -i 20-90 -n 1)% | Memory: $(shuf -i 40-95 -n 1)%"
  sleep 3
done | CLIENTNAME="ServerMonitor" URL=http://localhost PASSWORD=Test123 node monitor_client.js
```

**Python Client - Application Logs:**
```bash
tail -f /var/log/myapp.log | \
  CLIENTNAME="AppLogs" \
  URL=http://localhost \
  PASSWORD=Test123 \
  python3 monitor_client.py
```

**Either Client - JSON Data:**
```bash
echo '{"message":"Database query completed","duration_ms":150,"status":"success"}' | \
  CLIENTNAME="Database" URL=http://localhost PASSWORD=Test123 node monitor_client.js
```

**Web Dashboard:**
Join "ServerMonitor", "AppLogs", and "Database" rooms to see all data streams simultaneously.

## Components

The system consists of three main components:

### 1. Monitor Client (`/clients/`)
Lightweight clients (Node.js and Python) that read data from stdin and forward it to the backend.

**Purpose:** 
- Pipe data from any source (scripts, logs, commands)
- Rate limit messages to prevent overwhelming
- Handle multiple data formats (plain text, JSON, ICMP, HTTP)
- Connect securely to backend with authentication

**See:** [`source/clients/README.md`](./source/clients/README.md) for detailed usage

### 2. Backend Server (`/source/backend/`)
A Socket.IO server that manages client connections and forwards data to web browsers.

**Purpose:**
- Accept connections from monitor clients
- Authenticate clients with password protection
- Manage rooms for organizing data streams
- Forward real-time data to web browsers
- Provide client geographic information

**See:** [`source/backend/README.md`](./source/backend/README.md) for configuration and API

### 3. Frontend Dashboard (`/source/frontend/`)
A Vue.js web application that displays real-time data streams in an interactive dashboard.

**Purpose:**
- Display live data streams from monitor clients
- Manage room subscriptions (join/leave data sources)
- Visualize data with real-time charts
- Show connected client information and locations
- Provide responsive web interface

**See:** [`source/frontend/README.md`](./source/frontend/README.md) for development and deployment

## Docker Deployment

### Quick Start with Docker Compose

The system includes a ready-to-use docker-compose configuration:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access the dashboard
# Frontend: http://localhost (port 80)
# Backend API: http://localhost (routed by Traefik)
```

### Building Images

**Build scripts are provided for easy development:**

```bash
# Build backend (requires MaxMind credentials)
MAXMIND_ACCOUNT_ID=your_id MAXMIND_LICENSE_KEY=your_key ./build_backend.sh

# Build frontend
./build_frontend.sh

# Or use docker-compose to build both
docker-compose build
```

### Environment Setup

**Required environment variables:**

```bash
# For building backend with MaxMind geolocation
export MAXMIND_ACCOUNT_ID=your_account_id
export MAXMIND_LICENSE_KEY=your_license_key

# For runtime
export MAXMIND_ACCOUNT_ID=your_account_id
export MAXMIND_LICENSE_KEY=your_license_key
```

### Production Deployment

```bash
# Production deployment
docker-compose -f docker-compose.yaml up -d

# Scale if needed  
docker-compose up -d --scale monitor_backend=2
```

**Client Connection:**
```bash
# Node.js client
echo "Production alert" | \
  URL=http://your-server \
  PASSWORD=Test123 \
  CLIENTNAME="ProductionServer" \
  node monitor_client.js

# Python client  
echo "Production status" | \
  URL=http://your-server \
  PASSWORD=Test123 \
  CLIENTNAME="ProductionPython" \
  python3 monitor_client.py
```

## Web Interface Features

### Connected Clients Dashboard
- View all connected clients with real-time geolocation
- See IP addresses, cities, countries, and ISP information  
- Interactive map links for client locations
- Connection timestamps and AS number details

### IP Lookup Tool
- Built-in IP geolocation lookup with validation
- Search any IPv4 address for location details
- Interactive map integration via Google Maps
- Real-time results with city, country, coordinates

### Real-time Log Filtering  
- Regex-based filtering of incoming data streams
- Live filtering as you type
- Case-insensitive pattern matching
- Show all data when filter is empty

### Room Management
- Join/leave different data source rooms
- Organize multiple data streams
- Real-time subscription management

## Use Cases

### System Monitoring
- Server health metrics (CPU, memory, disk)
- Application log streaming
- Service status monitoring
- Performance metrics

### Network Monitoring  
- Ping latency tracking
- Bandwidth monitoring
- Connection status

### Application Monitoring
- Database query performance
- API response times
- Error log streaming
- User activity tracking

### DevOps & CI/CD
- Build pipeline status
- Deployment notifications
- Test result streaming
- Infrastructure alerts

### IoT & Sensors
- Temperature/humidity data
- Security camera alerts
- Environmental monitoring
- Equipment status

## Architecture Benefits

- **Decoupled Design**: Each component can be deployed independently
- **Language Agnostic**: Clients can be written in any language that outputs to stdout
- **Scalable**: Multiple clients can connect to single backend
- **Secure**: Password authentication and room-based access control
- **Real-time**: WebSocket-based for instant data delivery
- **Flexible**: Supports structured and unstructured data
- **Mobile-friendly**: Responsive web interface

## Getting Started

1. **Choose your setup:**
   - Local development: Follow "Quick Start Example" above
   - Docker deployment: Use Docker Compose configuration
   - Production: Deploy backend + frontend to servers

2. **Pick your data sources:**
   - Start with simple echo commands
   - Add log file tailing
   - Integrate with existing monitoring scripts
   - Build custom data collectors

3. **Customize the dashboard:**
   - Join relevant rooms for your data sources
   - Configure charts for numeric data
   - Set up multiple browser windows for different views

## Documentation

- **Client Usage**: [`source/clients/README.md`](./source/clients/README.md)
- **Backend Configuration**: [`source/backend/README.md`](./source/backend/README.md)  
- **Frontend Development**: [`source/frontend/README.md`](./source/frontend/README.md)

## License

ISC

---

**Ready to start monitoring?** Follow the Quick Start Example above to see your first real-time data stream in under 5 minutes!