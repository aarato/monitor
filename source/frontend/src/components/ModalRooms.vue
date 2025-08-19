<script setup>
import { onMounted, onUnmounted, reactive } from "vue";
import { useMonitorStore } from "../stores/monitor.js";
import { logger } from "../utils/logger.js";

const store = useMonitorStore();
let state = reactive({ rooms: [] });
const socket = store.socket;
let connectHandler = null;

function updateRooms() {
  return new Promise((resolve, reject) => {
    if (!socket.connected) {
      logger.warn("Socket not connected, cannot get rooms");
      resolve([]);
      return;
    }

    let resolved = false;

    socket.emit("get_rooms", null, (rooms) => {
      if (resolved) return; // Prevent double resolution
      resolved = true;

      if (rooms && Array.isArray(rooms)) {
        state.rooms = rooms;
        resolve(rooms);
      } else {
        logger.error("Invalid rooms response:", rooms);
        resolve([]);
      }
    });

    setTimeout(() => {
      if (resolved) return; // Don't timeout if already resolved
      resolved = true;
      logger.dev(
        "Get rooms timeout after 2 seconds (server may not be running)"
      );
      resolve([]);
    }, 2000);
  });
}

function joinAllRooms() {
  state.rooms.forEach((room) => {
    socket.emit("join_room", room.name, (success) => {
      logger.dev("Join room", success ? "OK" : "FAIL");
      if (!success) {
        logger.error(`Failed to join room: ${room.name}`);
      }
    });
  });
}

function selectRoom(e) {
  const room_name = e.target.name;
  // console.log(room_name)

  state.rooms.forEach((room) => {
    if (room.name == room_name) {
      if (room.member) {
        socket.emit("leave_room", room_name, (success) => {
          logger.dev("Leave room", success ? "OK" : "FAIL");
          if (!success) {
            logger.error(`Failed to leave room: ${room_name}`);
          }
        });
      } else {
        socket.emit("join_room", room_name, (success) => {
          logger.dev("Join room", success ? "OK" : "FAIL");
          if (!success) {
            logger.error(`Failed to join room: ${room_name}`);
          }
        });
      }
    }
  });
  updateRooms();
}

function chartChange(e) {
  store.clearChartInterval();
  store.setChartUpdateInterval(e.target.value);
  if (store.chart.updateMilliSec != "0") {
    store.setChartShow(true);
  } else {
    store.setChartShow(false);
  }
}

onMounted(async () => {
  logger.component(`Mounted: ModalRooms`);

  // Wait for socket connection before trying to get rooms
  if (socket.connected) {
    const rooms = await updateRooms();
    await joinAllRooms();
  } else {
    connectHandler = async () => {
      const rooms = await updateRooms();
      await joinAllRooms();
    };
    socket.on("connect", connectHandler);
  }

  const myModal = document.getElementById("modalRooms");
  myModal.addEventListener("shown.bs.modal", () => {
    logger.dev("Modal shown");
    updateRooms();
  });
});

onUnmounted(() => {
  if (connectHandler) {
    socket.off("connect", connectHandler);
    connectHandler = null;
  }
  logger.component(`Unmounted: ModalRooms`);
});
</script>

<template>
  <!-- Modal -->
  <div
    class="modal fade"
    id="modalRooms"
    tabindex="-1"
    aria-labelledby="modalRoomsLabel"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="modalRoomsLabel">Settings</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <p class="m-0">Sources</p>
          <div v-if="state.rooms.length" class="list-group">
            <button
              type="button"
              class="list-group-item list-group-item-light list-group-item-action"
              :class="room.member ? 'active ' : ''"
              :name="room.name"
              v-for="room in state.rooms"
              @click="selectRoom"
            >
              <i v-if="!room.member" class="bi bi-square"></i>
              <i v-if="room.member" class="bi bi-check-square"></i>
              &nbsp;{{ room.name }}
            </button>
          </div>
          <p v-else class="m-0">No available source is connected!</p>
          <hr />
          <p class="m-0">Round-Trip Time Chart</p>

          <select
            class="form-select bg-light"
            @change="chartChange"
            aria-label="Off"
          >
            <option selected value="0">Off</option>
            <option value="1000">1 s</option>
            <option value="500">500 ms</option>
            <option value="200">200 ms</option>
            <option value="100">100 ms</option>
            <option value="50">50 ms</option>
          </select>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
