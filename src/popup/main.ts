import { createApp } from "vue";
import PopupApp from "./PopupApp.vue";
import { initializeTheme } from "../shared/theme";
import "../styles.css";

async function bootstrap(): Promise<void> {
    await initializeTheme();
    createApp(PopupApp).mount("#app");
}

void bootstrap();
