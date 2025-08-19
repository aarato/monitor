<script setup>
import { reactive, onMounted, onUnmounted, onBeforeMount, watch } from "vue";
import { useMonitorStore } from "../stores/monitor.js";
import { TimeSeries, SmoothieChart } from "smoothie";
import { logger } from "../utils/logger.js";

const store = useMonitorStore();
let state = reactive({ text: "", id: null });
let resizeHandler = null;

function resize() {
  let elementWidth = document.getElementById("chartContainer").offsetWidth;
  store.setChartConfig({ width: elementWidth });
  // console.log(`Chart resized: ${elementWidth}X${elementHeight}`)
}

function chartUpdate(updateMilliSec) {
  store.clearChartInterval();
  if (updateMilliSec == "0") return;
  // if updateMillisec is non-zero start updating the chart
  const interval = setInterval(() => {
    if (store.connected && store.chart.updateMilliSec) {
      const start = new Date().getTime();
      store.socket.emit("ping", (reply) => {
        const delay = new Date().getTime() - start;
        store.chart.series.append(Date.now(), delay);
      });
    }
  }, updateMilliSec);
  store.setChartInterval(interval);
}

watch(
  () => store.chart.updateMilliSec,
  async (updateMilliSec) => {
    chartUpdate(updateMilliSec);
  }
);

onBeforeMount(() => {
  state.idChart = crypto.randomUUID();
});

onMounted(() => {
  logger.component(`Mounted: WindowChart`);
  const series = new TimeSeries();
  store.setChartSeries(series);
  var canvas = document.getElementById("chart");
  var chart = new SmoothieChart({ tooltip: true });
  chart.addTimeSeries(store.chart.series, {
    strokeStyle: "rgba(0, 255, 0, 1)",
  });
  chart.streamTo(canvas, 500);
  resizeHandler = () => resize();
  window.addEventListener("resize", resizeHandler);
  resize();
  chartUpdate(store.chart.updateMilliSec);
});

onUnmounted(() => {
  store.clearChartInterval();
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }
  logger.component(`Unmounted: WindowChart`);
});
</script>

<template>
  <div id="chartContainer">
    <canvas
      id="chart"
      :width="store.chart.config.width"
      :height="store.chart.config.height"
    ></canvas>
  </div>
</template>

<style scoped></style>
