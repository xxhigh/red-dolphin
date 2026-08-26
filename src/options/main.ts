import { createApp } from "vue";
import OptionsApp from "./OptionsApp.vue";
import { initializeTheme } from "../shared/theme";
import "../styles.css";

async function bootstrap(): Promise<void> {
    await initializeTheme();
    createApp(OptionsApp).mount("#app");
}

void bootstrap();
