import {
    DEFAULT_GENERAL_SETTINGS,
    parseGeneralSettings,
    type Theme,
} from "./settings";

export function applyTheme(theme: Theme): void {
    document.documentElement.dataset.theme = theme;
}

export async function initializeTheme(): Promise<void> {
    try {
        const stored = await chrome.storage.sync.get({
            generalSettings: DEFAULT_GENERAL_SETTINGS,
        });
        applyTheme(parseGeneralSettings(stored.generalSettings).theme);
    } catch {
        applyTheme(DEFAULT_GENERAL_SETTINGS.theme);
    }
}
