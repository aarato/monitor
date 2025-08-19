# Monitor Backend Server

A Socket.IO backend server that receives real-time data from monitor clients and forwards it to web browsers. Supports client authentication, room management, and geographic IP lookup.

## Overview

The Monitor Backend acts as a real-time data hub that:
- Receives data from monitor clients via Socket.IO
- Manages client authentication and rooms
- Forwards data to connected web browsers
- Provides client geographic information
- Handles multiple concurrent connections

## Quick Start

### Prerequisites

- **Node.js**: Version 18+ required
- **Port Access**: Default port 80 (configurable)

### Installation

```bash
npm install
```

### Basic Usage

**Start server (development):**
```bash
npm start
```

**Start with password protection:**
```bash
PASSWORD=your_secret_password npm start
```

**Start on custom port:**
```bash
PORT=5000 PASSWORD=secret123 npm start
```

**Production deployment:**
```bash
PORT=80 PASSWORD=production_password node index.js
```

## Configuration

Configure the server using environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `80` | Server port (use 5000+ for development) |
| `PASSWORD` | `null` | Authentication password (recommended) |
| `GEOLITE2_LICENSE_KEY` | `null` | MaxMind GeoLite2 license for IP geolocation |

### Security Configuration

**Enable authentication (recommended):**
```bash
PASSWORD=your_secure_password npm start
```

**Without authentication (insecure):**
```bash
npm start
# ⚠️ Warning: No authentication - all connections allowed
```

## Client Connection

### From Monitor Clients

Monitor clients connect automatically when configured with matching backend URL and password:

```bash
# Client connection example
echo "Hello" | URL=http://localhost:5000 PASSWORD=your_secure_password node monitor_client.js
```

### Authentication Process

1. Client sends username and hashed password
2. Server validates password hash
3. Client is joined to a room named after their username
4. Client can send/receive data in their room

## Room Management

### Automatic Room Creation

- Each authenticated client creates a room named after their username
- Example: Client with `CLIENTNAME=ServerMonitor` creates room `ServerMonitor`
- Clients can only send data to their own room

### Room Operations

**Join a room (from web interface):**
```javascript
socket.emit('join_room', 'ServerMonitor', (success) => {
  console.log('Joined room:', success);
});
```

**Leave a room:**
```javascript
socket.emit('leave_room', 'ServerMonitor', (success) => {
  console.log('Left room:', success);
});
```

**Get available rooms:**
```javascript
socket.emit('get_rooms', null, (rooms) => {
  console.log('Available rooms:', rooms);
  // Example: [{name: 'ServerMonitor', member: true}, {name: 'NetworkMonitor', member: false}]
});
```

## API Endpoints

### Socket.IO Events

**Server → Client Events:**
- `data` - Real-time data from monitor clients

**Client → Server Events:**
- `join_room(room, callback)` - Join a monitoring room
- `leave_room(room, callback)` - Leave a monitoring room  
- `get_rooms(data, callback)` - Get list of available rooms
- `get_clients(data, callback)` - Get connected client information
- `get_serverip(data, callback)` - Get server's public IP address
- `ping(callback)` - Health check

### Client Information

**Get connected clients with geographic data:**
```javascript
socket.emit('get_clients', null, (clients) => {
  console.log(clients);
  // Example response:
  // [
  //   {
  //     ipaddr: "*192.168.1.100", // * indicates current client
  //     country: "United States",
  //     city: "New York", 
  //     since: "Monday, 3:45:30 PM"
  //   }
  // ]
});
```

## Web Browser Integration

### Basic HTML Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Monitor Dashboard</title>
    <script src="/socket.io/socket.io.js"></script>
</head>
<body>
    <div id="messages"></div>
    
    <script>
        const socket = io();
        
        // Listen for real-time data
        socket.on('data', (message) => {
            const div = document.createElement('div');
            div.textContent = new Date().toLocaleTimeString() + ': ' + message;
            document.getElementById('messages').appendChild(div);
        });
        
        // Join a monitor room
        socket.emit('join_room', 'ServerMonitor', (success) => {
            if (success) {
                console.log('Successfully joined ServerMonitor room');
            }
        });
    </script>
</body>
</html>
```

### React Example

```javascript
import io from 'socket.io-client';

function MonitorDashboard() {
    const [messages, setMessages] = useState([]);
    const [socket, setSocket] = useState(null);
    
    useEffect(() => {
        const newSocket = io();
        setSocket(newSocket);
        
        // Listen for data
        newSocket.on('data', (message) => {
            setMessages(prev => [...prev, {
                time: new Date(),
                message: message
            }]);
        });
        
        // Join room
        newSocket.emit('join_room', 'ServerMonitor');
        
        return () => newSocket.close();
    }, []);
    
    return (
        <div>
            {messages.map((msg, i) => (
                <div key={i}>
                    {msg.time.toLocaleTimeString()}: {msg.message}
                </div>
            ))}
        </div>
    );
}
```

## Geographic Features

The server provides IP geolocation for connected clients using MaxMind GeoLite2.

### Setup Geolocation

1. **Get MaxMind License Key**: Sign up at maxmind.com
2. **Configure**: Set `GEOLITE2_LICENSE_KEY` environment variable
3. **Start Server**: Geographic data will be available in client info

```bash
GEOLITE2_LICENSE_KEY=your_license_key PORT=5000 npm start
```

## Deployment

### Development

```bash
# Local development
PORT=5000 PASSWORD=dev_password npm start
```

### Production

**Using PM2:**
```bash
# Install PM2
npm install -g pm2

# Start with PM2
PORT=80 PASSWORD=production_password pm2 start index.js --name monitor-backend

# Monitor
pm2 logs monitor-backend
pm2 status
```

**Using Docker:**
```bash
# Build image
docker build -t monitor-backend .

# Run container
docker run -d -p 80:80 -e PASSWORD=production_password monitor-backend
```

**Environment Variables for Production:**
```bash
export PORT=80
export PASSWORD=your_secure_production_password
export GEOLITE2_LICENSE_KEY=your_maxmind_license
node index.js
```

## Monitoring & Logs

### Server Logs

The server provides detailed logging:

```
2025-08-18 10:15:00.123 - info: Authentication enabled with password protection
2025-08-18 10:15:00.125 - info: Monitor server started on port 80 (default)
2025-08-18 10:15:00.130 - info: Server IP address: 203.0.113.1
Connected socket: abc123 user: ServerMonitor
Room join request for ServerMonitor from def456 is successful!
```

### Health Check

```bash
# Check if server is running
curl http://localhost/socket.io/
```

## Security

### Authentication

- **Always use PASSWORD in production**
- Password is hashed with SHA-256 before transmission
- Invalid tokens result in immediate disconnection

### CORS Configuration

Default CORS allows `http://localhost:4000` for development. Modify for production:

```javascript
const options = {
  cors: {
    origin: "https://yourproductiondomain.com",
    methods: ["GET", "POST"]
  }
}
```

## Troubleshooting

### Common Issues

**Port already in use:**
```
Error: listen EADDRINUSE :::80
```
→ Use different port: `PORT=5000 npm start`

**Client authentication failures:**
```
debug: abc123 with invalid token null
```
→ Ensure client and server use same PASSWORD

**Missing geographic data:**
```
warn: No MaxMind GeoLite2 license key found!
```
→ Set GEOLITE2_LICENSE_KEY environment variable

### Debug Mode

Enable detailed logging:
```bash
DEBUG=* npm start
```

## Files

- `index.js` - Main server application
- `log.js` - Logging configuration
- `geolookup.js` - Geographic IP lookup
- `package.json` - Dependencies and configuration
- `Dockerfile` - Container deployment

## License

ISC