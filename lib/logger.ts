/**
 * Simple logger utility that respects environment settings
 * In production, logs are only written if DEBUG is enabled
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.DEBUG === 'true' || isDevelopment;

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDebugEnabled) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    // Always log errors
    console.error(`[ERROR] ${message}`, ...args);
  },

  warn: (message: string, ...args: unknown[]) => {
    if (isDebugEnabled) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (isDebugEnabled) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
};
