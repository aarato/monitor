#!/usr/bin/env python3
"""
Python Monitor Client for Real-time Data Streaming
Reads data from stdin and forwards it to the monitoring backend via Socket.IO

Usage: echo "data" | python monitor_client.py
       tail -f logfile | python monitor_client.py
       ./data_generator | python monitor_client.py
"""

import sys
import os
import json
import time
import hashlib
import base64
import threading
from datetime import datetime
import socketio

# Configuration from environment variables
CLIENT_NAME = os.getenv('CLIENTNAME', 'Monitor')
URL = os.getenv('URL', 'http://localhost')
PASSWORD = os.getenv('PASSWORD', None)
INTERFACE = os.getenv('INTERFACE', 'eth0')
MAX_MESSAGES_PER_SECOND = int(os.getenv('MAX_MESSAGES_PER_SECOND', '10'))

class PythonMonitorClient:
    def __init__(self):
        self.sio = None
        self.connected = False
        self.message_count = 0
        self.dropped_count = 0
        self.last_second = int(time.time())
        self.overflow_sent = False
        self.setup_complete = False
        
    def start(self):
        print(f"Starting Python monitor client (reading from stdin)")
        print(f"Interface: {INTERFACE} (for display only)")
        
        # Check if running as piped input
        if sys.stdin.isatty():
            print("❌ This program reads from stdin (piped input)")
            print("💡 Usage: <data_source> | python monitor_client.py")
            print("💡 Example: echo 'Hello World' | URL=http://localhost PASSWORD=Test123 python monitor_client.py")
            print("💡 Example: tail -f /var/log/app.log | URL=http://localhost PASSWORD=Test123 python monitor_client.py")
            sys.exit(1)
        
        # Initialize Socket.IO client
        self.setup_socket_client()
        
        # Wait for connection and setup
        print("⏳ Waiting for Socket.IO connection...")
        self.wait_for_setup()
        
        # Set up stdin reading
        self.setup_stdin_reader()
        
    def setup_socket_client(self):
        """Initialize Socket.IO client with authentication"""
        auth_data = {}
        
        if PASSWORD:
            token = hashlib.sha256(PASSWORD.encode()).digest()
            token_b64 = base64.b64encode(token).decode()
            auth_data = {
                'user': {'username': CLIENT_NAME},
                'token': token_b64
            }
            print(f"Logging in with username {CLIENT_NAME}!")
        else:
            print(f"Logging in with username {CLIENT_NAME} and NO password set for authentication!")
            auth_data = {
                'user': {'username': CLIENT_NAME},
                'token': None
            }
        
        self.sio = socketio.Client()
        
        @self.sio.event
        def connect():
            self.connected = True
            print(f"Socket.IO connected as {CLIENT_NAME} on socket {self.sio.sid}")
            # Wait a bit for server-side room join to complete
            threading.Timer(2.0, self._mark_setup_complete).start()
        
        @self.sio.event
        def disconnect():
            self.connected = False
            print(f"Socket.IO disconnected")
        
        @self.sio.event
        def connect_error(data):
            print(f"Socket.IO connection failed: {data}")
        
        try:
            self.sio.connect(URL, auth=auth_data)
        except Exception as e:
            print(f"⚠️ Failed to connect to {URL}: {e}")
            print("⚠️ Proceeding anyway...")
    
    def _mark_setup_complete(self):
        """Mark setup as complete after room join delay"""
        self.setup_complete = True
        print("✅ Room join completed, ready to process stdin")
    
    def wait_for_setup(self):
        """Wait for connection and room join to complete"""
        timeout = 15  # 15 second timeout
        elapsed = 0
        
        while not self.setup_complete and elapsed < timeout:
            time.sleep(0.1)
            elapsed += 0.1
        
        if not self.setup_complete:
            print("⚠️ Socket.IO setup timeout, proceeding anyway...")
            self.setup_complete = True
    
    def setup_stdin_reader(self):
        """Set up stdin reading and processing"""
        print("💡 Reading JSON and plain text from stdin")
        print("💡 Usage: <data_source> | python monitor_client.py")
        
        try:
            for line in sys.stdin:
                if line.strip():
                    self.process_input_data(line.strip())
                        
        except KeyboardInterrupt:
            print("\nStopping monitor client...")
        except EOFError:
            print("stdin ended")
        except Exception as e:
            print(f"stdin error: {e}")
        finally:
            # Wait a moment for message transmission before disconnecting
            time.sleep(0.5)
            self.stop()
    
    def process_input_data(self, line):
        """Process a line of input data"""
        try:
            # Try to parse as JSON first
            data = json.loads(line)
            self.handle_structured_data(data)
        except json.JSONDecodeError:
            # If JSON parsing fails, treat as plain text
            self.handle_plain_text(line)
    
    def handle_structured_data(self, data):
        """Handle JSON data - could be ICMP, HTTP, or any other structured data"""
        message = ""
        
        # If data is not a dict, treat it as a simple value
        if not isinstance(data, dict):
            message = str(data)
        elif 'src_ip' in data and 'dst_ip' in data and 'icmp_type' in data:
            # ICMP data
            icmp_type_name = self.get_icmp_type_name(data.get('icmp_type'))
            icmp_code = data.get('icmp_code', '')
            message = f"ICMP {icmp_type_name} from {data['src_ip']} to {data['dst_ip']} (code: {icmp_code})"
        elif 'method' in data and 'url' in data:
            # HTTP data
            status = data.get('status', '')
            client_ip = data.get('client_ip', 'unknown')
            message = f"HTTP {data['method']} {data['url']} {status} from {client_ip}"
        elif 'message' in data:
            # Generic message data
            message = data['message']
        else:
            # Unknown structured data, stringify it
            message = json.dumps(data)
        
        print(message)
        self.send_message(message)
    
    def handle_plain_text(self, text_line):
        """Handle plain text data"""
        print(text_line)
        self.send_message(text_line)
    
    def get_icmp_type_name(self, icmp_type):
        """Convert ICMP type number to human readable name"""
        icmp_types = {
            0: "Echo Reply",
            3: "Destination Unreachable",
            4: "Source Quench",
            5: "Redirect",
            8: "Echo Request",
            11: "Time Exceeded",
            12: "Parameter Problem",
            13: "Timestamp Request",
            14: "Timestamp Reply",
            15: "Information Request",
            16: "Information Reply"
        }
        
        if isinstance(icmp_type, int):
            return icmp_types.get(icmp_type, f"Type {icmp_type}")
        else:
            return str(icmp_type)
    
    def send_message(self, message):
        """Send message with rate limiting"""
        if not self.sio or not self.connected:
            return
        
        current_second = int(time.time())
        
        # Reset counter every second
        if current_second != self.last_second:
            self.last_second = current_second
            self.message_count = 0
            self.overflow_sent = False
            
            # If we had dropped messages in the previous second, send overflow notification
            if self.dropped_count > 0:
                overflow_msg = f"⚠️ [{CLIENT_NAME}] Rate limit exceeded: {self.dropped_count} messages dropped in the last second"
                self.sio.emit('data', overflow_msg)
                self.dropped_count = 0
        
        # Check rate limit
        if self.message_count < MAX_MESSAGES_PER_SECOND:
            self.sio.emit('data', message)
            self.message_count += 1
            # Small delay to ensure message is transmitted
            time.sleep(0.1)
        else:
            # Count dropped message
            self.dropped_count += 1
            
            # Send overflow notification once per second
            if not self.overflow_sent:
                overflow_msg = f"⚠️ [{CLIENT_NAME}] Rate limit reached ({MAX_MESSAGES_PER_SECOND}/sec), dropping messages..."
                self.sio.emit('data', overflow_msg)
                self.overflow_sent = True
    
    def stop(self):
        """Clean shutdown"""
        print("Stopping monitor client...")
        
        if self.sio:
            self.sio.disconnect()
        
        sys.exit(0)

def main():
    """Main entry point"""
    try:
        monitor = PythonMonitorClient()
        monitor.start()
    except KeyboardInterrupt:
        print("\nShutting down...")
        sys.exit(0)
    except Exception as e:
        print(f"Failed to start monitor client: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()