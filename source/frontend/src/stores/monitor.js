import { defineStore } from "pinia";
import { io } from "socket.io-client";

export const useMonitorStore = defineStore("monitor", {
  state: () => ({
    textarea: "",
    connected: false,
    loggedIn: false,
    pause: false,
    serverIp: "",
    socket: (() => {
      const url = import.meta.env.DEV ? "http://localhost:5000" : "";
      return io(url);
    })(),
    chart: {
      show: false,
      config: {
        series: null,
        width: 500,
        height: 100,
      },
      series: null,
      updateMilliSec: 0,
      interval: null, // setInterval variable
    },
  }),

  actions: {
    setConnected(status) {
      this.connected = status;
    },

    setLoggedIn(status) {
      this.loggedIn = status;
    },

    setPause(status) {
      this.pause = status;
    },

    appendTextarea(text) {
      this.textarea += text;
      // Prevent unlimited growth - keep last 100KB of text
      if (this.textarea.length > 100000) {
        this.textarea = this.textarea.slice(-80000); // Keep last 80KB, remove oldest 20KB
      }
    },

    clearTextarea() {
      this.textarea = "";
    },

    setServerIp(ip) {
      this.serverIp = ip;
    },

    setChartShow(show) {
      this.chart.show = show;
    },

    setChartUpdateInterval(milliseconds) {
      this.chart.updateMilliSec = milliseconds;
    },

    setChartInterval(intervalId) {
      this.chart.interval = intervalId;
    },

    clearChartInterval() {
      if (this.chart.interval) {
        clearInterval(this.chart.interval);
        this.chart.interval = null;
      }
    },

    setChartSeries(series) {
      this.chart.series = series;
    },

    setChartConfig(config) {
      this.chart.config = { ...this.chart.config, ...config };
    },
  },
});
