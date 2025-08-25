<script setup>
import { onMounted, reactive } from "vue";
import { useMonitorStore } from "../stores/monitor.js";
import { logger } from "../utils/logger.js";

const store = useMonitorStore();
const socket = store.socket;

let state = reactive({
  clients: [],
});

function getClients() {
  return new Promise((resolve) => {
    logger.dev(`Clients start`);
    socket.emit("get_clients", null, (clients) => {
      state.clients = clients;
      clients.forEach((client) => {
        logger.dev(client);
      });

      resolve(clients);
    });
    setTimeout(() => {
      resolve([]);
    }, 2000);
  });
}

function getServerIp() {
  return new Promise((resolve) => {
    socket.emit("get_serverip", null, (serverip) => {
      resolve(serverip);
    });
    setTimeout(() => {
      resolve("Not Available");
    }, 2000);
  });
}

function openMap(coordinates) {
  if (coordinates && coordinates !== '0,0') {
    const url = `https://www.google.com/maps/place/${coordinates}`;
    window.open(url, '_blank');
  }
}

onMounted(async () => {
  logger.component(`Mounted: ModalLocation`);
  state.clients = await getClients();
  const myModal = document.getElementById("modalLocation");
  myModal.addEventListener("shown.bs.modal", async () => {
    logger.dev("Modal shown");
    state.clients = await getClients();
    logger.dev(state.clients);
  });
  store.serverIp = await getServerIp();
  logger.component(`Mounted: ModalLocation`);
});
</script>

<template>
  <div
    class="modal fade"
    id="modalLocation"
    tabindex="-1"
    aria-labelledby="modalLocationLabel"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="modalLocationLabel">Connected Clients</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="container">
            <div class="row flex-nowrap overflow-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Client IP</th>
                    <th scope="col">City</th>
                    <th scope="col">Country</th>
                    <th scope="col">Location</th>
                    <th scope="col">AS#</th>
                    <th scope="col">AS Organization</th>
                    <th scope="col">Connection Time</th>
                  </tr>
                </thead>
                <tbody v-for="client in state.clients" :key="client.ipaddr">
                  <tr>
                    <th scope="row">{{ client.ipaddr }}</th>
                    <td>{{ client.city }}</td>
                    <td>{{ client.country }}</td>
                    <td>
                      <button 
                        v-if="client.gps && client.gps !== '0,0'"
                        class="btn btn-sm btn-outline-secondary"
                        @click="openMap(client.gps)"
                        title="View on Google Maps"
                      >
                        <i class="bi bi-geo-alt text-muted"></i>
                      </button>
                      <span v-else class="text-muted">-</span>
                    </td>
                    <td>{{ client.as_number }}</td>
                    <td>{{ client.as_org }}</td>
                    <td>{{ client.since }}</td>
                  </tr>
                </tbody>
                <!-- <tbody>
                            <tr>
                            <th scope="row">200.211.212.232</th>
                            <td>Coppenhagen</td>
                            <td>Denmark</td>
                            <td>18844</td>
                            <td>Denmark AS Number org</td>
                            <td>2011-01-01 23:11:44</td>
                            </tr>
                        </tbody>                         -->
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer d-flex flex-row justify-content-between">
          <!-- <p>Server IP:&nbsp;{{store.serverip}}</p> -->
          <div class="form-floating">
            <input
              type="text"
              class="form-control input-sm"
              readonly
              id="floatingIP"
              :value="store.serverip"
            />
            <label for="floatingIP">Server IP</label>
          </div>
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
