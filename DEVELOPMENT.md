# Development Guide

This file provides guidance for developers working with code in this repository.

## Project Overview

This is a real-time network monitoring application with three main components:
- **Frontend**: Vue.js 3 application with real-time charts and monitoring dashboard
- **Backend**: WebSocket server using Socket.IO for real-time communication
- **Clients**: Various monitoring clients that collect and send data (HTTP, ping, syslog, time)

## Architecture

### Core Components

1. **Frontend Static Server** (`source/frontend/`)
   - Vue.js 3 application with Vite build system
   - Real-time dashboard with Socket.IO client connection
   - Components: NavBar, PageMain, WindowChart, WindowText, WindowInput, ModalRooms, ModalLocation
   - Uses Bootstrap 5, FontAwesome, and Smoothie charts for visualization

2. **Backend WebSocket Server** (`source/backend/`)
   - Express.js server with Socket.IO for real-time communication
   - Room-based authentication system using SHA256 hashed passwords
   - GeoIP lookup integration using MaxMind GeoLite2
   - Handles client connections, data broadcasting, and room management

3. **Monitor Clients** (`source/clients/`)
   - Multiple client types: HTTP monitoring, ping monitoring, syslog monitoring, time synchronization
   - All clients connect via Socket.IO with username/password authentication
   - Queue-based message system for reliable data transmission

### Authentication Flow

- Clients authenticate using username and SHA256-hashed password token
- Each client joins a room named after their username
- Backend validates rooms and manages permissions for joining/leaving rooms

### Data Flow

1. Monitor clients collect data (HTTP responses, ping results, syslog messages, time data)
2. Data is queued locally and sent to backend via Socket.IO every 100ms
3. Backend broadcasts data to appropriate rooms
4. Frontend receives real-time updates and displays in charts/tables

## Development Commands

### Frontend Development
```bash
cd source/frontend
npm run dev          # Start development server on port 4000
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # ESLint with auto-fix
```

### Backend Development
```bash
cd source/backend
npm start            # Start backend server (default port 80)
```

### Client Development
```bash
cd source/clients
# No specific dev scripts - clients run directly with node
node monitor_client_http.js     # HTTP monitoring client
node monitor_client_ping.js     # Ping monitoring client
node monitor_client_syslog.js   # Syslog monitoring client
node monitor_client_time.js     # Time synchronization client
```

## Docker Deployment

The application is designed for containerized deployment using Docker Compose:

```bash
# Deploy full stack
docker compose up -d

# Components:
# - traefik (reverse proxy on port 80/8080)
# - monitor_backend (WebSocket server)
# - monitor_frontend (static file server)
# - monitor_client_http (HTTP monitoring)
```

## Environment Variables

### Backend Server
- `PORT`: Server port (default: 80)
- `PASSWORD`: Authentication password for clients

### Monitor Clients
- `URL`: Backend server URL (default: http://localhost:5000)
- `CLIENTNAME`: Client identifier/username
- `PASSWORD`: Authentication password (must match backend)

## Network Monitoring Setup

The system can monitor ICMP traffic using iptables and rsyslog:

```bash
# Log ICMP packets with rate limiting
sudo iptables -I INPUT 1 -p icmp -m limit --limit 10/second --limit-burst 10 -j LOG --log-prefix "IPT_ICMP " --log-level info

# Forward logs to monitoring server (replace IP)
# Add to /etc/rsyslog.d/30-icmp-remote.conf:
if ($programname == "kernel" and ($msg contains "IPT_ICMP ")) then {
    action(type="omfwd" target="10.0.0.5" port="5514" protocol="udp")
    stop
}
```

## Key Dependencies

- **Frontend**: Vue 3, Vite, Socket.IO client, Bootstrap 5, FontAwesome, Smoothie charts
- **Backend**: Express.js, Socket.IO, Winston logging, MaxMind GeoIP, js-yaml
- **Clients**: Socket.IO client, Winston logging, various monitoring libraries

## File Structure Notes

- `monitor_client/` contains legacy client code - active development is in `source/clients/`
- `cloud_setup/` contains Azure deployment scripts and Terraform configurations
- `monitor_static/` appears to be legacy static files
- Each component has its own `package.json` with specific dependencies and scripts