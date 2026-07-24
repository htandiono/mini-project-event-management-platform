import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";

const env = getEnv();
const app = createApp({ frontendUrl: env.FRONTEND_URL });

app.listen(env.API_PORT);
