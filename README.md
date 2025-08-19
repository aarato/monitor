# Real-time Monitoring System

A complete real-time monitoring solution that streams data from any source to web browsers. Send data from servers, applications, network devices, or custom scripts directly to a live web dashboard.

## What It Does

The monitoring system creates a real-time data pipeline:

```
Data Source → Monitor Client → Backend Server → Web Dashboard
     ↓              ↓              ↓              ↓
  Any program    Node.js       Socket.IO      Vue.js web app
  that outputs   stdin reader   server with    with real-time
  text/JSON      with rate      authentication charts and
                 limiting       and rooms      room management
```

**Key Features:**
- ✅ **Universal Input**: Accept data from any source via stdin
- ✅ **Real-time Streaming**: Instant data delivery to web browsers
- ✅ **Multiple Data Sources**: Support for text, JSON, and structured data
- ✅ **Room Management**: Organize data streams by client/purpose
- ✅ **Rate Limiting**: Built-in protection against data floods
- ✅ **Authentication**: Secure client connections with password protection
- ✅ **Geographic Info**: IP geolocation for connected clients
- ✅ **Interactive Charts**: Live data visualization
- ✅ **Responsive Design**: Works on desktop and mobile

## Components

The system consists of three main components:

### 1. Monitor Client (`/clients/`)
A lightweight Node.js client that reads data from stdin and forwards it to the backend.

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

## Quick Start Example

Here's a complete example showing all three components working together:

### Step 1: Start Backend Server

```bash
cd source/backend
npm install
PORT=5000 PASSWORD=secret123 npm start
```

Expected output:
```
2025-08-18 10:15:00.123 - info: Authentication enabled with password protection
2025-08-18 10:15:00.125 - info: Monitor server started on port 5000 (custom)
2025-08-18 10:15:00.130 - info: Server IP address: 192.168.1.100
```

### Step 2: Start Frontend Dashboard

```bash
cd source/frontend
npm install
npm run dev
```

Expected output:
```
Local:   http://localhost:4000/
Network: use --host to expose
```

### Step 3: Send Data from Monitor Client

```bash
cd source/clients
npm install

# Send a simple message
echo "Server status: All systems operational" | \
  URL=http://localhost:5000 \
  PASSWORD=secret123 \
  CLIENTNAME="ServerMonitor" \
  node monitor_client.js
```

### Step 4: View in Web Browser

1. Open http://localhost:4000
2. Click "Rooms" button in navigation
3. Join the "ServerMonitor" room
4. You'll see the message appear in real-time: "Server status: All systems operational"

## Advanced Examples

### Multiple Data Sources

**Terminal 1 - Server Monitoring:**
```bash
while true; do
  echo "CPU: $(shuf -i 20-90 -n 1)% | Memory: $(shuf -i 40-95 -n 1)% | Load: $(shuf -i 1-8 -n 1).$(shuf -i 0-9 -n 1)"
  sleep 3
done | CLIENTNAME="ServerMonitor" URL=http://localhost:5000 PASSWORD=secret123 node monitor_client.js
```

**Terminal 2 - Application Logs:**
```bash
tail -f /var/log/myapp.log | \
  CLIENTNAME="AppLogs" \
  URL=http://localhost:5000 \
  PASSWORD=secret123 \
  node monitor_client.js
```

**Terminal 3 - Network Monitoring:**
```bash
while true; do
  ping -c 1 8.8.8.8 | grep "time=" | awk '{print "Ping to 8.8.8.8: " $7}'
  sleep 2
done | CLIENTNAME="NetworkMonitor" URL=http://localhost:5000 PASSWORD=secret123 node monitor_client.js
```

**Web Dashboard:**
- Join "ServerMonitor", "AppLogs", and "NetworkMonitor" rooms
- See data from all three sources simultaneously
- Each data source appears in separate, organized streams

### JSON Data Streaming

```bash
# Database monitoring with structured data
echo '{"message":"Database query completed","duration_ms":150,"status":"success","rows_affected":42}' | \
  CLIENTNAME="Database" \
  URL=http://localhost:5000 \
  PASSWORD=secret123 \
  node monitor_client.js
```

**Result:** Formatted as "Database query completed" in the web interface


## Docker Deployment

### Using Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: ./source/backend
    ports:
      - "5000:80"
    environment:
      - PASSWORD=production_secret123
      - GEOLITE2_LICENSE_KEY=your_maxmind_key
    
  frontend:
    build: ./source/frontend
    ports:
      - "4000:80"
    depends_on:
      - backend
```

**Deploy:**
```bash
docker-compose up -d
```

### Individual Docker Builds

**Backend:**
```bash
cd source/backend
docker build -t monitor-backend .
docker run -d -p 5000:80 -e PASSWORD=secret123 monitor-backend
```

**Frontend:**
```bash
cd source/frontend
docker build -t monitor-frontend .
docker run -d -p 4000:80 monitor-frontend
```

**Client (from any server):**
```bash
echo "Docker container started" | \
  URL=http://your-backend-server:5000 \
  PASSWORD=secret123 \
  CLIENTNAME="DockerHost" \
  node monitor_client.js
```

## Production Deployment

### Backend (Production)
```bash
cd source/backend
PORT=80 PASSWORD=production_secret123 GEOLITE2_LICENSE_KEY=your_key npm start
```

### Frontend (Production)
```bash
cd source/frontend
npm run build
# Deploy dist/ folder to web server (nginx, Apache, etc.)
```

### Client Configuration
```bash
# Production client example
echo "Production system alert" | \
  URL=https://monitor.yourcompany.com \
  PASSWORD=production_secret123 \
  CLIENTNAME="ProductionServer01" \
  node monitor_client.js
```

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