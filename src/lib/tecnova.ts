import { tecnovaSingleton } from "@evovee/tecnova-api";

const nodeEnv = process.env.REACT_APP_NODE_ENV!;
const apiKey = process.env.REACT_APP_DISPLAY_API_KEY!;

if (!apiKey) {
    console.warn("REACT_APP_DISPLAY_API_KEY is not set in environment variables");
}

const tecnova = tecnovaSingleton({
    apiKey: apiKey || "",
    nodeEnv: "production",
});

export default tecnova;