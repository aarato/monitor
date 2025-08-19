const io = require("socket.io-client");
const crypto = require("crypto");
const log = require('./log.js');

// Factory function to create Socket.IO client
function createSocketClient(url, clientname, password) {
    const options = {
        auth: {
            user: { username: clientname },
            token: password ? crypto.createHash('sha256').update(password).digest('base64') : null
        }
    };

    if (!password) {
        log.warn(`Logging in with username ${clientname} and NO password set for authentication!`);
    } else {
        log.info(`Logging in with username ${clientname}!`);
    }

    const socket = io(url, options);

    socket.on('connect', () => {
        log.info(`Socket.io connected as ${clientname} on socket ${socket.id}`);
    });

    socket.on('disconnect', (reason) => {
        if (reason === "io server disconnect") {
            log.error("The server has forcefully disconnected the socket:", reason);
        } else if (reason === "io client disconnect") {
            log.error("The socket was manually disconnected using:", reason);
        } else if (reason === "ping timeout") {
            log.error("The server did not send a PING within the pingInterval:", reason);
        } else if (reason === "transport close") {
            log.error("The connection was closed (by server?) or lost:", reason);
        } else if (reason === "transport error") {
            log.error("The connection has encountered an error:", reason);
        } else {
            log.error("Unknown disconnection reason:", reason);
        }
    });

    socket.io.on("error", (error) => {
        log.error(error.message);
    });

    return socket;
}

module.exports = createSocketClient;