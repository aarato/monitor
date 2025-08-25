<script setup>
import { onMounted, reactive, ref, computed } from "vue";
import { useMonitorStore } from "../stores/monitor.js";
import { logger } from "../utils/logger.js";

const store = useMonitorStore();
const socket = store.socket;

let state = reactive({
  result: null,
  loading: false,
  error: null,
});

const ipAddress = ref("");

const isValidIP = computed(() => {
  const ip = ipAddress.value.trim();
  if (!ip) return false;
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
});

function lookupIp() {
  if (!ipAddress.value.trim()) {
    state.error = "Please enter an IP address";
    return;
  }

  state.loading = true;
  state.error = null;
  state.result = null;

  socket.emit("get_location", ipAddress.value.trim(), (result) => {
    state.loading = false;
    
    if (result.error) {
      state.error = result.error;
    } else {
      state.result = result;
      logger.dev("IP lookup result:", result);
    }
  });

  setTimeout(() => {
    if (state.loading) {
      state.loading = false;
      state.error = "Request timeout";
    }
  }, 5000);
}

function clearResults() {
  state.result = null;
  state.error = null;
}

function clearAll() {
  state.result = null;
  state.error = null;
  ipAddress.value = "";
}

function openMap(coordinates) {
  if (coordinates && coordinates !== '0,0') {
    const url = `https://www.google.com/maps/place/${coordinates}`;
    window.open(url, '_blank');
  }
}

onMounted(() => {
  logger.component(`Mounted: ModalIpLookup`);
  
  const myModal = document.getElementById("modalIpLookup");
  myModal.addEventListener("shown.bs.modal", () => {
    logger.dev("IP Lookup modal shown");
  });
});
</script>

<template>
  <div
    class="modal fade"
    id="modalIpLookup"
    tabindex="-1"
    aria-labelledby="modalIpLookupLabel"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="modalIpLookupLabel">IP Address Lookup</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="container">
            <div class="row mb-3">
              <div class="col-9">
                <input
                  v-model="ipAddress"
                  type="text"
                  class="form-control"
                  placeholder="Enter IP address (e.g., 8.8.8.8)"
                  @keyup.enter="lookupIp"
                />
              </div>
              <div class="col-3">
                <button
                  class="btn btn-primary w-100"
                  :disabled="state.loading || !isValidIP"
                  @click="lookupIp"
                >
                  <span v-if="state.loading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ state.loading ? 'Looking up...' : 'Lookup' }}
                </button>
              </div>
            </div>
            
            <div v-if="ipAddress.trim() && !isValidIP" class="row">
              <div class="col-12">
                <div class="alert alert-warning">
                  Please enter a valid IP address
                </div>
              </div>
            </div>
            
            <div v-if="state.error" class="row">
              <div class="col-12">
                <div class="alert alert-danger">
                  {{ state.error }}
                </div>
              </div>
            </div>
            
            <div v-if="state.result" class="row">
              <div class="col-12">
                <table class="table table-striped">
                  <tbody>
                    <tr>
                      <th scope="row">IP Address</th>
                      <td>{{ state.result.ipaddr }}</td>
                    </tr>
                    <tr>
                      <th scope="row">City</th>
                      <td>{{ state.result.city || 'Unknown' }}</td>
                    </tr>
                    <tr>
                      <th scope="row">Country</th>
                      <td>{{ state.result.country || 'Unknown' }}</td>
                    </tr>
                    <tr>
                      <th scope="row">Coordinates</th>
                      <td>
                        {{ state.result.gps || 'Unknown' }}
                        <button 
                          v-if="state.result.gps && state.result.gps !== '0,0'"
                          class="btn btn-sm btn-outline-secondary ms-2"
                          @click="openMap(state.result.gps)"
                          title="View on Google Maps"
                        >
                          <i class="bi bi-geo-alt text-muted"></i>
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">AS Number</th>
                      <td>{{ state.result.as_number || 'Unknown' }}</td>
                    </tr>
                    <tr>
                      <th scope="row">AS Organization</th>
                      <td>{{ state.result.as_org || 'Unknown' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="clearAll"
          >
            Clear
          </button>
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

<style scoped></style>