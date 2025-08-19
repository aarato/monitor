// Logger utility with environment-aware logging
const isDevelopment = import.meta.env.DEV;

export const logger = {
  // Always logs (both dev and prod) - for critical info
  log: (...args) => {
    console.log(...args);
  },

  // Development only - for debugging/verbose info
  dev: (...args) => {
    if (isDevelopment) {
      console.log("[DEV]", ...args);
    }
  },

  // Production only - for important runtime info
  prod: (...args) => {
    if (!isDevelopment) {
      console.log("[PROD]", ...args);
    }
  },

  // Always logs warnings
  warn: (...args) => {
    console.warn(...args);
  },

  // Always logs errors
  error: (...args) => {
    console.error(...args);
  },

  // Connection status (probably want in both)
  connection: (...args) => {
    console.log("[CONNECTION]", ...args);
  },

  // Socket events (you might want dev only)
  socket: (...args) => {
    if (isDevelopment) {
      console.log("[SOCKET]", ...args);
    }
  },

  // Component lifecycle (dev only)
  component: (...args) => {
    if (isDevelopment) {
      console.log("[COMPONENT]", ...args);
    }
  },
};
