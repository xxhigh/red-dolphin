const DEFAULT_SETTINGS = { enabled: true };

chrome.runtime.onInstalled.addListener(async () => {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    await chrome.storage.sync.set(settings);
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    if (typeof message === "object" && message !== null && "type" in message && message.type === "ping") {
        sendResponse({ ok: true });
    }
});
