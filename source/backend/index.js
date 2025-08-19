const express = require('express');
const crypto = require('crypto');
const app = express();
const server = require('http').createServer(app);
const log = require('./log.js')
const geolookup = require('./geolookup');
const requestIp = require('request-ip');
let   myip = "N/A"

const port     = process.env.PORT || 80;
const password = process.env.PASSWORD || null
const token    = process.env.PASSWORD ? crypto.createHash('sha256').update(password).digest('base64') : null
const options = {
  cors: {
    origin: "http://localhost:4000",
    methods: ["GET", "POST"]
  }
}

process.on('SIGINT', function() {
  console.log("Caught interrupt signal");
  process.exit();
});

process.on('SIGTERM', function() {
  console.log( "\nGracefully shutting down from SIGTERM" );
  process.exit(0);
});

if ( ! password ) {
  log.warn("No PASSWORD environment variable set - socket is open for all connections!")
} else {
  log.info("Authentication enabled with password protection")
}

if ( ! process.env.GEOLITE2_LICENSE_KEY && ! require('./package.json').geolite2?.['license-key'] ) {
  log.warn("No MaxMind GeoLite2 license key found! Set GEOLITE2_LICENSE_KEY environment variable or add to package.json")
}

function isValidRoom(room){
  if (typeof room != "string" ) {
    console.log("Invalid room named received!", room)
    return false
  }

  const rooms_map  = io.of("/").adapter.rooms;
  if ( rooms_map.has(room) ) {
    let valid = false
    const sid_map = rooms_map.get(room)
    sid_map.forEach((sid) => {
      const socket = io.sockets.sockets.get(sid);
      if (socket.user?.username == room){
        // console.log("User",socket.user?.username, room)
        valid = true
      }
    })
    return valid
  }
  else{
    return false
  }

}

function get_valid_rooms(io){
  let rooms = []
  const rooms_map = io.of("/").adapter.rooms;

  rooms_map.forEach((sids, room)=>{
    if ( isValidRoom(room)) {
      rooms.push(room)
    } 
  })
  return rooms;
}



const io = require('socket.io')(server,options);

// AUTH


io.use((socket, next) => {
  if (socket.handshake.auth.user){
    if( socket.handshake.auth.token != token) { 
      log.debug(`${socket.id} with invalid token ${socket.handshake.auth.token }`)
      socket.disconnect()
      return next(new Error('Invalid token'));
    }else{
      socket.user = socket.handshake.auth.user   
      return next();
    }
  }else{
    log.debug(`${socket.id} with no username!`)
    return next();
  }
});
  

io.on('connection', socket => {

  
  if ( socket.user?.username ) {
    // socket.clientIp = socket.user.username; 
    socket.join(socket.user.username)
    console.log(`Connected socket: ${socket.id} user: ${socket.user.username}`);
  }else{
    socket.clientIp = requestIp.getClientIp(socket.request); 
    console.log(`Connected socket: ${socket.id}`);
  }

  socket.on('disconnect', () => {
    console.log(`disconnect ${socket.id}`);
  });
  
  socket.on("data", (data) => {
    if ( socket.user){
      io.to(socket.user.username).emit("data" , data );
    }
  });  

  socket.on("join_room", (room, callback) => {
    if (isValidRoom(room)){
      socket.join(room);
      console.log(`Room join request for ${room} from ${socket.id} is successful!`)
      callback(true);      
    }
    else{
      console.log(`Room join request for ${room} from ${socket.id} failed!`)
      callback(false);      
    }

  });  

  socket.on("leave_room", (room, callback) => {
    if (isValidRoom(room)){
      console.log(`Room leave request for ${room} from ${socket.id}`)
      socket.leave(room);
      callback(true)
    }
    else{
      console.log(`Room leave request for ${room} from ${socket.id} failed!`)
      callback(false);      
    }

  });  

  socket.on("get_rooms", (data, callback) => {
    const room_names = get_valid_rooms(io)
    const sids_map = io.of("/").adapter.sids;
    const sid_rooms = sids_map.get(socket.id)
    let rooms = []
    room_names.forEach((room_name) => {
      if ( sid_rooms.has(room_name) ){
        rooms.push( { name: room_name, member: true})
      }else{
        rooms.push( { name: room_name, member: false})
      }
    })
    callback(rooms);
  });  

  socket.on("get_clients", async (data, callback) => {
    const clients = []
    const sockets = Array.from(io.sockets.sockets)
    for (let index = 0; index < sockets.length; index++) {
      let socket_cur = sockets[index][1];
      if ( socket_cur.clientIp ) {
        let geo = await geolookup(socket_cur.clientIp,"")
        geo.ipaddr = socket_cur.id == socket.id ? "*" + socket_cur.clientIp : socket_cur.clientIp
        geo.since = new Date(socket_cur.handshake.issued).toLocaleDateString('en-US', { weekday: 'long' }) + ', ' + new Date(socket_cur.handshake.issued).toLocaleTimeString('en-US') 
        clients.push(geo)
  
      }
    }
    callback(clients);
  });  

  socket.on("get_serverip", async (data, callback) => {
    callback(myip);
  });  

  socket.on("ping", (callback) => {
    log.debug("pong",new Date())
    callback("pong");
  });  

});

server.listen(port, "0.0.0.0", () => {
  log.info(`Monitor server started on port ${port} (${port === 80 ? 'default' : 'custom'})`)
});
fetch("http://checkip.amazonaws.com")
.then( response => response.text() )
.then( response => {
  myip = response.trim()
  log.info(`Server IP address: ${myip}`)
})
.catch(function (err) {
    log.error("Unable to fetch server IP address", err);
});
