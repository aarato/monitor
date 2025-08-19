const createSocketClient = require("./socket_client.js");

const CLIENTNAME = process.env.CLIENTNAME || "Monitor";
const URL = process.env.URL || "http://localhost";
const PASSWORD = process.env.PASSWORD || null;
const INTERFACE = process.env.INTERFACE || "eth0";
const MAX_MESSAGES_PER_SECOND = parseInt(process.env.MAX_MESSAGES_PER_SECOND) || 10;

class GenericMonitorClient {
    constructor() {
        this.socketClient = null;
        this.messageCount = 0;
        this.droppedCount = 0;
        this.lastSecond = Math.floor(Date.now() / 1000);
        this.overflowSent = false;
    }

    async start() {
        console.log(`Starting generic monitor client (reading from stdin)`);
        console.log(`Interface: ${INTERFACE} (for display only)`);
        
        // Initialize Socket.IO client
        this.socketClient = createSocketClient(URL, CLIENTNAME, PASSWORD);
        
        // Wait for Socket.IO connection before setting up stdin
        console.log(`⏳ Waiting for Socket.IO connection...`);
        await this.waitForConnection();
        
        // Set up stdin reading
        this.setupStdinReader();
        
        // Handle graceful shutdown
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    waitForConnection() {
        return new Promise((resolve, reject) => {
            if (this.socketClient && this.socketClient.connected) {
                // Already connected, wait a bit for room join to complete
                console.log(`⏳ Waiting for room join to complete...`);
                setTimeout(() => {
                    console.log(`✅ Socket.IO ready (room joined), ready to process stdin`);
                    resolve();
                }, 1000); // Wait 1 second for room join
                return;
            }

            const timeout = setTimeout(() => {
                console.log(`⚠️  Socket.IO connection timeout, proceeding anyway...`);
                resolve();
            }, 10000); // 10 second timeout (increased to allow for room join)

            if (this.socketClient) {
                this.socketClient.on('connect', () => {
                    clearTimeout(timeout);
                    console.log(`✅ Socket.IO connected, waiting for room join...`);
                    // Wait a moment for server-side room join to complete
                    setTimeout(() => {
                        console.log(`✅ Room join completed, ready to process stdin`);
                        resolve();
                    }, 1000); // Wait 1 second for room join
                });

                this.socketClient.on('connect_error', (err) => {
                    clearTimeout(timeout);
                    console.log(`⚠️  Socket.IO connection failed: ${err}, proceeding anyway...`);
                    resolve(); // Don't reject, just proceed without connection
                });
            } else {
                clearTimeout(timeout);
                console.log(`⚠️  No Socket.IO client, proceeding anyway...`);
                resolve();
            }
        });
    }

    setupStdinReader() {
        console.log(`💡 Reading JSON and plain text from stdin`);
        console.log(`💡 Usage: <data_source> | node monitor_client.js`);
        
        // Set stdin to text mode
        process.stdin.setEncoding('utf8');
        
        let buffer = '';
        
        process.stdin.on('data', (chunk) => {
            buffer += chunk;
            
            // Process complete lines
            let lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer
            
            lines.forEach(line => {
                if (line.trim()) {
                    this.processInputData(line.trim());
                }
            });
        });
        
        process.stdin.on('end', () => {
            console.log('stdin ended');
            process.exit(0);
        });
        
        process.stdin.on('error', (err) => {
            console.error('stdin error:', err);
            process.exit(1);
        });
    }

    processInputData(line) {
        try {
            // Try to parse as JSON first
            const data = JSON.parse(line);
            this.handleStructuredData(data);
        } catch (err) {
            // If JSON parsing fails, treat as plain text
            this.handlePlainText(line);
        }
    }

    handleStructuredData(data) {
        // Handle JSON data - could be ICMP, HTTP, or any other structured data
        let message;
        
        if (data.src_ip && data.dst_ip && typeof data.icmp_type !== 'undefined') {
            // ICMP data
            const icmpTypeName = this.getICMPTypeName(data.icmp_type);
            message = `ICMP ${icmpTypeName} from ${data.src_ip} to ${data.dst_ip} (code: ${data.icmp_code})`;
        } else if (data.method && data.url) {
            // HTTP data
            message = `HTTP ${data.method} ${data.url} ${data.status || ''} from ${data.client_ip || 'unknown'}`;
        } else if (data.message) {
            // Generic message data
            message = data.message;
        } else {
            // Unknown structured data, stringify it
            message = JSON.stringify(data);
        }
        
        console.log(message);
        
        // Rate limit and send via Socket.IO
        this.sendMessage(message);
    }

    handlePlainText(textLine) {
        // For plain text, just emit it directly
        console.log(textLine);
        
        // Rate limit and send via Socket.IO
        this.sendMessage(textLine);
    }

    getICMPTypeName(icmpType) {
        const ICMP_TYPES = {
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
        };
        
        return typeof icmpType === 'number' 
            ? ICMP_TYPES[icmpType] || `Type ${icmpType}`
            : icmpType;
    }

    sendMessage(message) {
        if (!this.socketClient || !this.socketClient.connected) {
            return;
        }

        const currentSecond = Math.floor(Date.now() / 1000);
        
        // Reset counter every second
        if (currentSecond !== this.lastSecond) {
            this.lastSecond = currentSecond;
            this.messageCount = 0;
            this.overflowSent = false;
            
            // If we had dropped messages in the previous second, send overflow notification
            if (this.droppedCount > 0) {
                this.socketClient.emit('data', `⚠️ [${CLIENTNAME}] Rate limit exceeded: ${this.droppedCount} messages dropped in the last second`);
                this.droppedCount = 0;
            }
        }
        
        // Check rate limit
        if (this.messageCount < MAX_MESSAGES_PER_SECOND) {
            this.socketClient.emit('data', message);
            this.messageCount++;
        } else {
            // Count dropped message
            this.droppedCount++;
            
            // Send overflow notification once per second
            if (!this.overflowSent) {
                this.socketClient.emit('data', `⚠️ [${CLIENTNAME}] Rate limit reached (${MAX_MESSAGES_PER_SECOND}/sec), dropping messages...`);
                this.overflowSent = true;
            }
        }
    }

    stop() {
        console.log('Stopping monitor client...');
        
        if (this.socketClient) {
            this.socketClient.disconnect();
        }
        
        process.exit(0);
    }
}

// Check if running as piped input
if (process.stdin.isTTY) {
    console.error('❌ This program reads from stdin (piped input)');
    console.error('💡 Usage: <data_source> | node monitor_client.js');
    console.error('💡 Example: echo "Hello World" | URL=http://localhost:5000 PASSWORD=Test123 node monitor_client.js');
    console.error('💡 Example: ./monitor_ebpf_reader | URL=http://localhost:5000 PASSWORD=Test123 node monitor_client.js');
    process.exit(1);
}

// Start the monitor
const monitor = new GenericMonitorClient();
monitor.start().catch(err => {
    console.error('Failed to start monitor client:', err);
    process.exit(1);
});