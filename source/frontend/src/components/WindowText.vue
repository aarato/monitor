<script setup>
import { reactive, onMounted, onBeforeMount, onUnmounted } from "vue";
import { useMonitorStore } from "../stores/monitor.js";
import { logger } from "../utils/logger.js";

const store = useMonitorStore();
let state = reactive({ text: "", id: null });
let textUpdateInterval = null;

onBeforeMount(() => {
  state.id = crypto.randomUUID();
});

onMounted(() => {
  logger.component(`Mounted: WindowText`);
  const taElement = document.getElementById(state.id);

  textUpdateInterval = setInterval(() => {
    // Only update 100ms period
    if (state.text != store.textarea && !store.pause) {
      state.text = store.textarea;
      taElement.scrollTop = taElement.scrollHeight; //scroll to bottom
    }
  }, 100);
});

onUnmounted(() => {
  if (textUpdateInterval) {
    clearInterval(textUpdateInterval);
    textUpdateInterval = null;
  }
  logger.component(`Unmounted: WindowText`);
});
</script>

<template>
  <div class="d-flex flex-column flex-grow-1 bg-secondary overflow-auto">
    <textarea
      :id="state.id"
      class="flex-grow-1 text-light p-1 bg-dark border-0"
      cols="5"
      rows="5"
      contenteditable
      spellcheck="false"
      placeholder="Incoming connections to this site will be displayed here...."
      readonly
      >{{ state.text }}</textarea
    >
  </div>
</template>

<style scoped></style>
