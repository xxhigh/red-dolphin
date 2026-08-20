const FIXED_TARGET_URL = "https://auth.skala-ai.com";
const DEFAULT_FIELDS = [
    {
        selector: "input[class='auth-input']",
        value: "이름",
        delaySeconds: 0,
    },
    {
        selector:
            "#app > div > div > div.auth-form > div:nth-child(2) > div > select",
        value: "US",
        delaySeconds: 0,
    },
    {
        selector:
            "#app > div > div > div.auth-form > div:nth-child(3) > div > select",
        value: "18",
        delaySeconds: 0,
    },
];

const DEFAULT_SETTINGS = {
    enabled: true,
    notifyOnStartup: true,
    soundEnabled: true,
    scheduledActionMode: "notify",
    notifyTime: "09:00",
    targetUrl: FIXED_TARGET_URL,
    userAgentMode: "mobile",
    customUserAgent: "",
    fields: DEFAULT_FIELDS,
};

const NOTIFICATION_ID = "alert-auth-skala";
const ALARM_NAME = "daily-alert-auth-skala";
const USER_AGENT_RULE_ID = 1001;
const STARTUP_NOTIFICATION_START_MINUTES = 9 * 60 + 10;
const STARTUP_NOTIFICATION_END_MINUTES = 17 * 60 + 50;
const STARTUP_NOTIFICATION_AFTER_HOURS_MINUTES = 18 * 60 + 30;

const USER_AGENTS = {
    mobile: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.0.0 Mobile/15E148 Safari/604.1",
};

initializeBackground();

chrome.runtime.onInstalled.addListener(async () => {
    await ensureDefaultSettings();
    await scheduleDailyAlarm();
});

chrome.runtime.onStartup.addListener(async () => {
    await ensureDefaultSettings();
    await scheduleDailyAlarm();

    const settings = await getSettings();
    if (
        settings.enabled &&
        settings.notifyOnStartup &&
        isOutsideStartupQuietTime()
    ) {
        await showNotification();
    }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== ALARM_NAME) return;

    const settings = await getSettings();
    if (settings.enabled) {
        if (settings.scheduledActionMode === "autoRun") {
            await runConfiguredFlow();
        } else {
            await showNotification();
        }
    }
});

chrome.notifications.onButtonClicked.addListener(
    async (notificationId, buttonIndex) => {
        if (!notificationId.startsWith(NOTIFICATION_ID) || buttonIndex !== 0)
            return;
        await runConfiguredFlow();
    },
);

chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (!notificationId.startsWith(NOTIFICATION_ID)) return;
  await runConfiguredFlow();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "settingsUpdated") {
        scheduleDailyAlarm()
            .then(() => sendResponse({ ok: true }))
            .catch((error) =>
                sendResponse({ ok: false, error: error.message }),
            );
        return true;
    }

    if (message?.type === "runNow") {
        runConfiguredFlow()
            .then(() => sendResponse({ ok: true }))
            .catch((error) =>
                sendResponse({ ok: false, error: error.message }),
            );
        return true;
    }

    if (message?.type === "testNotification") {
        showNotification()
            .then(() => sendResponse({ ok: true }))
            .catch((error) =>
                sendResponse({ ok: false, error: error.message }),
            );
        return true;
    }

    if (message?.type === "getDiagnostics") {
        getDiagnostics()
            .then((diagnostics) => sendResponse({ ok: true, diagnostics }))
            .catch((error) =>
                sendResponse({ ok: false, error: error.message }),
            );
        return true;
    }

    return false;
});

async function initializeBackground() {
    await ensureDefaultSettings();
    await scheduleDailyAlarm();
}

async function ensureDefaultSettings() {
    const current = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    await chrome.storage.sync.set(normalizeSettings(current));
}

async function getSettings() {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    return normalizeSettings(settings);
}

function normalizeSettings(settings) {
    return {
        ...DEFAULT_SETTINGS,
        ...settings,
        targetUrl: FIXED_TARGET_URL,
        userAgentMode:
            settings.userAgentMode === "custom" ? "custom" : "mobile",
        scheduledActionMode:
            settings.scheduledActionMode === "autoRun" ? "autoRun" : "notify",
        fields: mergeWithDefaultFields(settings.fields),
    };
}

function mergeWithDefaultFields(fields) {
    const source = Array.isArray(fields) ? fields : [];

    return DEFAULT_FIELDS.map((defaultField) => {
        const saved = source.find(
            (field) => field.selector === defaultField.selector,
        );

        return {
            ...defaultField,
            ...saved,
            selector: defaultField.selector,
            value:
                defaultField.value === "US"
                    ? "US"
                    : (saved?.value ?? defaultField.value),
        };
    });
}

async function scheduleDailyAlarm() {
    const settings = await getSettings();
    await chrome.alarms.clear(ALARM_NAME);

    if (!settings.enabled || !settings.notifyTime) return;

    chrome.alarms.create(ALARM_NAME, {
        when: nextOccurrence(settings.notifyTime),
        periodInMinutes: 24 * 60,
    });
}

async function getDiagnostics() {
    const settings = await getSettings();
    const alarm = await chrome.alarms.get(ALARM_NAME);

    return {
        enabled: settings.enabled,
        notifyOnStartup: settings.notifyOnStartup,
        soundEnabled: settings.soundEnabled,
        scheduledActionMode: settings.scheduledActionMode,
        notifyTime: settings.notifyTime,
        targetUrl: settings.targetUrl,
        scheduledTime: alarm?.scheduledTime
            ? new Date(alarm.scheduledTime).toLocaleString()
            : "",
        chromeNotificationsAvailable: Boolean(chrome.notifications),
    };
}

function nextOccurrence(timeText) {
    const [hours, minutes] = timeText.split(":").map(Number);
    const next = new Date();
    next.setHours(hours || 0, minutes || 0, 0, 0);

    if (next.getTime() <= Date.now()) {
        next.setDate(next.getDate() + 1);
    }

    return next.getTime();
}

function isOutsideStartupQuietTime(date = new Date()) {
    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    return (
        currentMinutes < STARTUP_NOTIFICATION_START_MINUTES ||
        (currentMinutes > STARTUP_NOTIFICATION_END_MINUTES &&
            currentMinutes < STARTUP_NOTIFICATION_AFTER_HOURS_MINUTES)
    );
}

async function showNotification() {
    const settings = await getSettings();
    const message = settings.targetUrl
        ? "입실/퇴실 체크를 해주세요."
        : "옵션에서 이동할 페이지를 먼저 설정하세요.";

    await chrome.notifications.create(`${NOTIFICATION_ID}-${Date.now()}`, {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "스칼라 출결 알림이",
        message,
        priority: 2,
        buttons: [{ title: "페이지 열기" }],
    });

    if (settings.soundEnabled) {
        await playNotificationSound();
    }
}

async function playNotificationSound() {
    if (!chrome.offscreen?.createDocument) return;

    const offscreenUrl = chrome.runtime.getURL("offscreen.html");
    const contexts = await chrome.runtime.getContexts({
        contextTypes: ["OFFSCREEN_DOCUMENT"],
        documentUrls: [offscreenUrl],
    });

    if (!contexts.length) {
        await chrome.offscreen.createDocument({
            url: "offscreen.html",
            reasons: ["AUDIO_PLAYBACK"],
            justification: "알림이 표시될 때 짧은 알림음을 재생합니다.",
        });
    }

    await chrome.runtime.sendMessage({ type: "playNotificationSound" });
}

async function runConfiguredFlow() {
    const settings = await getSettings();

    if (!settings.targetUrl) {
        await chrome.runtime.openOptionsPage();
        return;
    }

    const tab = await chrome.tabs.create({ url: "about:blank", active: true });
    await applyUserAgent(tab.id, settings);
    await chrome.tabs.update(tab.id, { url: settings.targetUrl });
    await waitForTabComplete(tab.id);
    await fillPage(tab.id, settings);
}

async function applyUserAgent(tabId, settings) {
    await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [USER_AGENT_RULE_ID],
    });

    const userAgent = resolveUserAgent(settings);
    if (!userAgent) return;

    await chrome.declarativeNetRequest.updateSessionRules({
        addRules: [
            {
                id: USER_AGENT_RULE_ID,
                priority: 1,
                action: {
                    type: "modifyHeaders",
                    requestHeaders: [
                        {
                            header: "User-Agent",
                            operation: "set",
                            value: userAgent,
                        },
                    ],
                },
                condition: {
                    tabIds: [tabId],
                    resourceTypes: [
                        "main_frame",
                        "sub_frame",
                        "xmlhttprequest",
                        "script",
                        "stylesheet",
                        "image",
                    ],
                },
            },
        ],
    });
}

function resolveUserAgent(settings) {
    if (settings.userAgentMode === "custom")
        return settings.customUserAgent.trim();
    return USER_AGENTS.mobile;
}

function waitForTabComplete(tabId) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            reject(new Error("페이지 로딩 시간이 초과되었습니다."));
        }, 30000);

        const listener = (updatedTabId, changeInfo) => {
            if (updatedTabId !== tabId || changeInfo.status !== "complete")
                return;
            clearTimeout(timeoutId);
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
        };

        chrome.tabs.onUpdated.addListener(listener);
        chrome.tabs.get(tabId).then((tab) => {
            if (tab.status === "complete") {
                clearTimeout(timeoutId);
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        });
    });
}

async function fillPage(tabId, settings) {
    if (!settings.fields.length) return;

    await chrome.scripting.executeScript({
        target: { tabId },
        func: fillConfiguredFields,
        args: [settings.fields],
    });
}

async function fillConfiguredFields(fields) {
    const SELECT_OPTION_TIMEOUT_MS = 15000;
    const VALUE_RETRY_COUNT = 5;
    const VALUE_RETRY_DELAY_MS = 250;

    const setNativeValue = (element, value) => {
        const prototype = Object.getPrototypeOf(element);
        const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

        if (descriptor?.set) {
            descriptor.set.call(element, value);
        } else {
            element.value = value;
        }
    };

    const sleep = (milliseconds) =>
        new Promise((resolve) => setTimeout(resolve, milliseconds));

    const waitForElement = (selector) =>
        new Promise((resolve) => {
            const existing = document.querySelector(selector);
            if (existing) {
                resolve(existing);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (!element) return;
                clearTimeout(timeoutId);
                observer.disconnect();
                resolve(element);
            });

            const timeoutId = setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, 10000);

            observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
            });
        });

    const waitForSelectOption = (select, value) =>
        new Promise((resolve) => {
            const hasOption = () =>
                [...select.options].some((option) => option.value === value);

            if (hasOption()) {
                resolve(true);
                return;
            }

            const observer = new MutationObserver(() => {
                if (!hasOption()) return;
                clearTimeout(timeoutId);
                observer.disconnect();
                resolve(true);
            });

            const timeoutId = setTimeout(() => {
                observer.disconnect();
                resolve(false);
            }, SELECT_OPTION_TIMEOUT_MS);

            observer.observe(select, { childList: true, subtree: true });
        });

    const dispatchValueEvents = (element) => {
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
        element.dispatchEvent(new Event("blur", { bubbles: true }));
    };

    const setElementValue = async (element, value) => {
        if (
            element instanceof HTMLInputElement &&
            ["checkbox", "radio"].includes(element.type)
        ) {
            element.checked = ["true", "1", "yes", "on"].includes(
                String(value).toLowerCase(),
            );
            dispatchValueEvents(element);
            return;
        }

        if (element instanceof HTMLSelectElement) {
            await waitForSelectOption(element, String(value));
        }

        if (
            element instanceof HTMLSelectElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLInputElement
        ) {
            for (let attempt = 0; attempt < VALUE_RETRY_COUNT; attempt += 1) {
                setNativeValue(element, String(value ?? ""));
                dispatchValueEvents(element);

                if (
                    !(element instanceof HTMLSelectElement) ||
                    element.value === String(value ?? "")
                ) {
                    return;
                }

                await sleep(VALUE_RETRY_DELAY_MS);
            }
            return;
        }

        element.textContent = String(value ?? "");
        dispatchValueEvents(element);
    };

    for (const field of fields) {
        if (!field?.selector) continue;

        const delaySeconds = Math.max(Number(field.delaySeconds) || 0, 0);
        if (delaySeconds > 0) {
            await new Promise((resolve) =>
                setTimeout(resolve, delaySeconds * 1000),
            );
        }

        const element = await waitForElement(field.selector);
        if (!element) continue;

        await setElementValue(element, field.value);
    }
}
