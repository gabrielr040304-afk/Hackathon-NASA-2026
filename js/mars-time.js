import { MARS_SOL_SECONDS } from './config.js';
// Duration and suit models use SI seconds; a 24-hour Mars clock divides one sol.
export const marsMinutes = (seconds) => seconds * 1440 / MARS_SOL_SECONDS;
