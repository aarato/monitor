<script setup>
import { onMounted, onUnmounted } from "vue";
import { useMonitorStore } from "../stores/monitor.js";
import WindowInput from "./WindowInput.vue";
import WindowText from "./WindowText.vue";
import WindowChart from "./WindowChart.vue";
import { logger } from "../utils/logger.js";

const store = useMonitorStore();
let socket = null;

// Define event handlers to enable cleanup
const handleConnect = () => {
  store.setConnected(true);
  console.log(`Connected ${socket.id}`);
};

const handleDisconnect = () => {
  store.setConnected(false);
  console.log(`Disconnected ${socket.id}`);
};

const handleConnectError = (error) => {
  store.setConnected(false);
  logger.error("Socket connection error:", error);
};

const handleData = (data) => {
  let message;
  let clientName = "";
  
  // Check if data is an object with client info
  if (typeof data === "object" && data.message && data.client) {
    message = data.message;
    clientName = `[${data.client}] `;
  } else {
    // Handle legacy string data
    message = typeof data === "string" ? data : JSON.stringify(data);
  }
  
  // Format timestamp as HH:MM:SS
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  
  store.appendTextarea(`[${timeString}] ${clientName}${message}\n`);
  
  if (store.chart.series && !isNaN(message)) {
    store.chart.series.append(Date.now(), +message);
  }
};

onMounted(async () => {
  logger.component(`Mounted: PageMain`);
  socket = store.socket;

  socket.on("connect", handleConnect);
  socket.on("disconnect", handleDisconnect);
  socket.on("connect_error", handleConnectError);
  socket.on("data", handleData);
});

onUnmounted(() => {
  if (socket) {
    socket.off("connect", handleConnect);
    socket.off("disconnect", handleDisconnect);
    socket.off("connect_error", handleConnectError);
    socket.off("data", handleData);
  }
  logger.component(`Unmounted: PageMain`);
});
</script>

<template>
  <div class="m-1 p-1 d-flex flex-column bg-dark h-100 border-0 overflow-auto">
    <WindowInput v-if="false" />
    <WindowText />
    <WindowChart v-if="store.chart.show" />
  </div>
</template>

<style scoped></style>
