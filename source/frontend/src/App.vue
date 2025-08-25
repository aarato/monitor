<script setup>
import NavBar from "./components/NavBar.vue";
import PageMain from "./components/PageMain.vue";
import ModalRooms from "./components/ModalRooms.vue";
import ModalLocation from "./components/ModalLocation.vue";
import ModalIpLookup from "./components/ModalIpLookup.vue";
import { onMounted } from "vue";
import { logger } from "./utils/logger.js";

onMounted(() => {
  logger.component(`Mounted: App`);
});
</script>

<template>
  <NavBar />
  <PageMain />
  <ModalRooms />
  <ModalLocation />
  <ModalIpLookup />
</template>

<style>
html,
body,
#app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: grey;
}
</style>
