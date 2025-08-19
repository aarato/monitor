<template>
  <div :id="idInput" class="container mt-3 mb-3 p-0">
    <!-- BODY WITH DYNAMIC INPUTS   -->
    <div class="d-flex">
      <div class="d-flex flex-column justify-content-between">
        <div
          v-for="input in inputs"
          :key="input.id"
          class="m-1 d-flex justify-content-end"
        >
          <label class="m-1 float-right text-nowrap" :for="input.id">{{
            input.label
          }}</label>
          <span class="m-1 float-right" v-tooltip:left="input.information">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-info-circle"
              viewBox="0 0 16 16"
            >
              <path
                d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"
              />
              <path
                d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"
              />
            </svg>
          </span>
        </div>
      </div>

      <div class="d-flex flex-column justify-content-between w-100">
        <div v-for="input in inputs" :key="input.id" class="m-1">
          <input
            class="form-control"
            :type="input.type"
            :name="input.id"
            :id="config.id + input.id"
            :placeholder="input.placeholder"
            v-model="values[input.id]"
            @change="inputChange"
            @click="inputClick"
          />
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="d-flex justify-content-end m-1">
      <!-- FOOTER FALLBACK -->
      <slot name="footer" v-bind:footer="values"> </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeMount } from "vue";
import { useMonitorStore } from "../stores/monitor.js";
import { logger } from "../utils/logger.js";

const store = useMonitorStore();

let state = reactive({ text: "", id: null });

const idInput = ref(0);

onBeforeMount(() => {
  idInput.value = "input-" + crypto.randomUUID();
});

onMounted(() => {
  logger.component(`Mounted: WindowInput`, idInput.value);
});
</script>

<style scoped></style>
