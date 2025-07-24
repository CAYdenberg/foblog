import { config } from "./plugin/config.ts";

export const warn = (message: string) => {
  if (config.logLevel) {
    console.warn(`Foblog: ${message}`);
  }
};

export const log = (message: string) => {
  if (config.logLevel === "verbose") {
    console.log(`Foblog: ${message}`);
  }
};
