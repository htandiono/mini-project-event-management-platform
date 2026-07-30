import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";

const env = getEnv();
const app = createApp({
  frontendUrl: env.FRONTEND_URL,
  frontendPreviewUrl: env.FRONTEND_PREVIEW_URL,
  presentationUrl: env.PRESENTATION_URL,
});

app.listen(env.API_PORT);
