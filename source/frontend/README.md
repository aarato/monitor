# Monitor Frontend

A Vue.js web dashboard for visualizing real-time data from monitor clients. Connects to the monitor backend via Socket.IO to display live data streams, manage client rooms, and provide interactive monitoring capabilities.

## Overview

The Monitor Frontend provides:
- **Real-time Data Display**: Live streams from connected monitor clients
- **Room Management**: Join/leave specific monitor client rooms
- **Interactive Charts**: Real-time data visualization with SmoothieCharts
- **Client Information**: Geographic location and connection details
- **Responsive Design**: Bootstrap-based UI that works on desktop and mobile

## Quick Start

### Prerequisites

- **Node.js**: Version 18+ required
- **Monitor Backend**: Must be running and accessible
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

### Installation

```bash
npm install
```

### Development

**Start development server:**
```bash
npm run dev
```
→ Opens at `http://localhost:4000`

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

## Configuration

### Backend Connection

The frontend automatically detects the backend connection:

**Development mode** (`npm run dev`):
- Connects to `http://localhost:5000`
- Assumes backend running on port 5000

**Production mode** (`npm run build`):
- Connects to same domain as frontend
- Assumes backend on same server

### Environment Configuration

Create `.env` file for custom configuration:

```env
# Custom backend URL (optional)
VITE_BACKEND_URL=http://your-backend-server.com:5000

# Development settings
VITE_APP_TITLE=Monitor Dashboard
```

## Features

### Real-time Data Streaming

**Automatic Connection:**
- Frontend connects to backend automatically
- Displays connection status in navbar
- Reconnects automatically if connection lost

**Data Display:**
- Real-time text stream in main window
- Automatic scrolling to latest messages
- Pause/resume functionality
- Clear/reset message history

### Room Management

**Available Rooms:**
- View all active monitor client rooms
- See which rooms you're currently joined to
- Join multiple rooms simultaneously
- Leave rooms when no longer needed

**Example rooms:**
- `ServerMonitor` - Server health monitoring
- `NetworkMonitor` - Network traffic data  
- `AppLogs` - Application log streaming
- `ICMP` - Network ping monitoring

### Interactive Charts

**Real-time Charts:**
- SmoothieCharts integration for live data visualization
- Configurable chart dimensions and update intervals
- Support for numeric data streams
- Toggle chart display on/off

**Chart Configuration:**
- Width/height customizable
- Update frequency adjustable
- Multiple data series support
- Smooth animation and transitions

### Client Information

**Connected Clients:**
- View all clients connected to backend
- Geographic location display (if GeoIP enabled)
- Connection timestamps
- IP address information

**Geographic Features:**
- Country and city display
- Visual indicators for client locations
- Connection duration tracking

## Usage Examples

### Basic Monitoring Dashboard

1. **Start Backend:**
   ```bash
   cd ../backend
   PORT=5000 PASSWORD=secret123 npm start
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Send Data from Client:**
   ```bash
   cd ../clients
   echo "Server CPU: 85%" | URL=http://localhost:5000 PASSWORD=secret123 CLIENTNAME="ServerMonitor" node monitor_client.js
   ```

4. **View in Browser:**
   - Open `http://localhost:4000`
   - Click "Rooms" → Join "ServerMonitor" room
   - See real-time message: "Server CPU: 85%"

### Multiple Data Sources

**Terminal 1 - Server Monitoring:**
```bash
while true; do
  echo "CPU: $(shuf -i 20-90 -n 1)%"
  sleep 2
done | CLIENTNAME="ServerMonitor" URL=http://localhost:5000 node monitor_client.js
```

**Terminal 2 - Network Monitoring:**
```bash
while true; do
  echo "Ping: $(shuf -i 10-100 -n 1)ms"
  sleep 1
done | CLIENTNAME="NetworkMonitor" URL=http://localhost:5000 node monitor_client.js
```

**Web Dashboard:**
- Join both "ServerMonitor" and "NetworkMonitor" rooms
- See data from both sources in real-time
- Toggle between different data streams

### JSON Data Visualization

**Send structured data:**
```bash
echo '{"message":"Database query completed","duration_ms":150,"status":"success"}' | CLIENTNAME="Database" URL=http://localhost:5000 node monitor_client.js
```

**Result in frontend:**
- Formatted display of structured data
- JSON data automatically parsed and presented
- Rich formatting for better readability

## Components

### Core Components

**NavBar.vue:**
- Connection status indicator
- Room management buttons
- Server information display
- Theme/settings controls

**PageMain.vue:**
- Main data display area
- Text stream window
- Chart display window
- Input controls for testing

**WindowText.vue:**
- Real-time text message display
- Auto-scrolling message list
- Pause/resume functionality
- Message history management

**WindowChart.vue:**
- Live data chart visualization
- SmoothieCharts integration
- Configurable chart settings
- Real-time data plotting

### Modal Components

**ModalRooms.vue:**
- Available rooms list
- Join/leave room controls
- Room membership status
- Real-time room updates

**ModalLocation.vue:**
- Connected clients display
- Geographic information
- Connection timestamps
- Client details

## Development

### Project Structure

```
src/
├── App.vue              # Main application component
├── main.js              # Application entry point
├── components/
│   ├── NavBar.vue       # Navigation and status bar
│   ├── PageMain.vue     # Main content area
│   ├── WindowText.vue   # Text data display
│   ├── WindowChart.vue  # Chart visualization
│   ├── ModalRooms.vue   # Room management modal
│   └── ModalLocation.vue # Client info modal
├── stores/
│   └── monitor.js       # Pinia state management
├── utils/
│   └── logger.js        # Logging utilities
└── assets/
    ├── base.css         # Base styles
    └── main.css         # Main styles
```

### State Management

**Pinia Store (monitor.js):**
```javascript
// Socket.IO connection
socket: io(backendUrl)

// UI State
connected: false
textarea: ""
pause: false

// Chart Configuration
chart: {
  show: false,
  config: { width: 500, height: 100 },
  series: null
}
```

### Socket.IO Events

**Listening for data:**
```javascript
socket.on('data', (message) => {
  // Display in text window
  // Update charts if numeric
  // Handle different data types
});
```

**Room management:**
```javascript
socket.emit('get_rooms', null, (rooms) => {
  // Update available rooms list
});

socket.emit('join_room', roomName, (success) => {
  // Handle join result
});
```

## Styling

### Bootstrap Integration

- Bootstrap 5 for responsive layout
- Bootstrap Icons for UI elements
- Custom CSS for monitor-specific styling
- Dark/light theme support

### Responsive Design

- Mobile-friendly interface
- Adaptive layouts for different screen sizes
- Touch-friendly controls
- Optimized for both desktop and mobile use

## Deployment

### Development Deployment

```bash
# Start development server
npm run dev
```
→ Available at `http://localhost:4000`

### Production Deployment

**Build static files:**
```bash
npm run build
```

**Deploy with web server:**
```bash
# Using serve
npm install -g serve
serve -s dist -l 4000

# Using nginx
cp -r dist/* /var/www/html/

# Using Apache
cp -r dist/* /var/www/html/
```

### Docker Deployment

**Build image:**
```bash
docker build -t monitor-frontend .
```

**Run container:**
```bash
docker run -d -p 4000:80 monitor-frontend
```

### Production Environment

**Environment variables:**
```bash
# Backend URL for production
export VITE_BACKEND_URL=https://your-production-backend.com

# Build with production config
npm run build
```

## Troubleshooting

### Connection Issues

**Backend not accessible:**
- Check if backend is running on correct port
- Verify backend URL in browser console
- Check CORS configuration in backend

**No data appearing:**
- Ensure monitor clients are sending data
- Check if joined to correct rooms
- Verify authentication between client and backend

**Chart not updating:**
- Ensure data contains numeric values
- Check chart configuration settings
- Verify chart series initialization

### Development Issues

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Linting errors:**
```bash
# Fix linting issues
npm run lint
```

## Browser Compatibility

- **Chrome**: 88+ ✅
- **Firefox**: 78+ ✅
- **Safari**: 14+ ✅
- **Edge**: 88+ ✅
- **Mobile Safari**: 14+ ✅
- **Chrome Mobile**: 88+ ✅

## License

ISC