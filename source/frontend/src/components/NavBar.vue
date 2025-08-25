<script setup>
import { onMounted } from "vue";
import { useMonitorStore } from "../stores/monitor.js";
import ButtonIcon from "./ButtonIcon.vue";
import { Modal } from "bootstrap";
import { logger } from "../utils/logger.js";

const store = useMonitorStore();

function login() {
  store.setLoggedIn(true);
}

function logout() {
  store.setLoggedIn(false);
}

function trash() {
  store.clearTextarea();
}

function rooms() {
  let elem = document.getElementById("modalRooms");
  let modal = new Modal(elem);
  modal.show();
}

function location() {
  let elem = document.getElementById("modalLocation");
  let modal = new Modal(elem);
  modal.show();
}

function ipLookup() {
  let elem = document.getElementById("modalIpLookup");
  let modal = new Modal(elem);
  modal.show();
}

onMounted(() => {
  logger.component(`Mounted: NavBar`);
});
</script>

<template>
  <nav
    id="Navbar"
    class="ps-1 pe-1 navbar sticky-top navbar-expand navbar-dark bg-dark"
  >
    <div class="btn-group">
      <ButtonIcon icon="ethernet" text="Connected Clients" @click="location" />
      <ButtonIcon icon="search" text="IP Lookup" @click="ipLookup" />
      <ButtonIcon
        v-if="!store.pause"
        icon="pause-circle"
        text="pause"
        @click="store.setPause(true)"
      />
      <ButtonIcon
        v-else
        icon="play-circle"
        text="start"
        @click="store.setPause(false)"
      />
      <ButtonIcon
        v-if="store.textarea != ''"
        icon="trash"
        text="Clear"
        @click="trash"
      />
      <ButtonIcon v-if="false" icon="house-door" text="Home" />
      <ButtonIcon v-if="false" icon="clipboard" text="Copy" />
      <ButtonIcon
        v-if="!store.connected"
        icon="sign-stop"
        text="Not connected to server"
      />
    </div>
    
    <div class="mx-auto d-flex align-items-center">
      <input
        type="text"
        class="form-control form-control-sm text-light bg-dark border-secondary"
        style="width: 200px; --bs-border-opacity: .5;"
        placeholder="Filter (regex)"
        v-model="store.filterRegex"
        title="Filter lines using regular expressions"
      />
    </div>
    
    <div class="btn-group">
      <ButtonIcon icon="gear" text="Settings" @click="rooms" />
    </div>
  </nav>
</template>

<style scoped>
.form-control::placeholder {
  color: #adb5bd !important;
  opacity: 1;
}
</style>
