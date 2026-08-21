import {
    ATTENDANCE_TARGET_URL,
    isRunAttendanceMessage,
    type RunAttendanceResponse,
} from "../shared/attendance";
import {
    DEFAULT_USER_SETTINGS,
    parseUserSettings,
    type ClassGroup,
    type UserSettings,
} from "../shared/settings";

const USER_AGENT_RULE_ID = 1001;
const MOBILE_USER_AGENT =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.0.0 Mobile/15E148 Safari/604.1";
const PAGE_LOAD_TIMEOUT_MS = 30_000;
const CLASS_SELECT_VALUES: Record<ClassGroup, string> = {
    "1반": "15",
    "2반": "16",
    "3반": "17",
    "4반": "18",
};

interface AttendanceField {
    selector: string;
    value: string;
    delaySeconds: number;
}

chrome.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse) => {
        if (!isRunAttendanceMessage(message)) {
            return false;
        }

        runAttendanceFlow()
            .then(() => {
                const response: RunAttendanceResponse = { ok: true };
                sendResponse(response);
            })
            .catch((error: unknown) => {
                const response: RunAttendanceResponse = {
                    ok: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : "출석 페이지 자동화를 실행하지 못했습니다.",
                };
                sendResponse(response);
            });

        return true;
    },
);

async function runAttendanceFlow(): Promise<void> {
    const stored = await chrome.storage.sync.get({
        userSettings: DEFAULT_USER_SETTINGS,
    });
    const settings = parseUserSettings(stored.userSettings);
    const tab = await chrome.tabs.create({ url: "about:blank", active: true });

    if (tab.id === undefined) {
        throw new Error("출석 페이지 탭을 생성하지 못했습니다.");
    }

    await applyMobileUserAgent(tab.id);
    await chrome.tabs.update(tab.id, { url: ATTENDANCE_TARGET_URL });
    await waitForTabComplete(tab.id);
    await fillAttendancePage(tab.id, settings);
}

async function applyMobileUserAgent(tabId: number): Promise<void> {
    await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [USER_AGENT_RULE_ID],
        addRules: [
            {
                id: USER_AGENT_RULE_ID,
                priority: 1,
                action: {
                    type: "modifyHeaders" as chrome.declarativeNetRequest.RuleActionType,
                    requestHeaders: [
                        {
                            header: "User-Agent",
                            operation:
                                "set" as chrome.declarativeNetRequest.HeaderOperation,
                            value: MOBILE_USER_AGENT,
                        },
                    ],
                },
                condition: {
                    tabIds: [tabId],
                    requestDomains: [
                        "auth.skala-ai.com",
                        "accounts.google.com",
                        "att.skala-ai.com",
                        "lms.skala-ai.com",
                    ],
                    resourceTypes: [
                        "main_frame",
                        "sub_frame",
                        "xmlhttprequest",
                        "script",
                        "stylesheet",
                        "image",
                    ] as chrome.declarativeNetRequest.ResourceType[],
                },
            },
        ],
    });
}

function waitForTabComplete(tabId: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            reject(new Error("출석 페이지 로딩 시간이 초과되었습니다."));
        }, PAGE_LOAD_TIMEOUT_MS);

        const finish = (): void => {
            clearTimeout(timeoutId);
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
        };

        const listener = (
            updatedTabId: number,
            changeInfo: chrome.tabs.OnUpdatedInfo,
        ): void => {
            if (updatedTabId === tabId && changeInfo.status === "complete") {
                finish();
            }
        };

        chrome.tabs.onUpdated.addListener(listener);
        void chrome.tabs.get(tabId).then((tab) => {
            if (tab.status === "complete") {
                finish();
            }
        });
    });
}

async function fillAttendancePage(
    tabId: number,
    settings: UserSettings,
): Promise<void> {
    if (!settings.classGroup) {
        throw new Error("설정에서 사용자 반을 먼저 선택해 주세요.");
    }

    const fields: AttendanceField[] = [
        {
            selector: "input[class='auth-input']",
            value: settings.userName,
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
            value: CLASS_SELECT_VALUES[settings.classGroup],
            delaySeconds: 0,
        },
    ];

    await chrome.scripting.executeScript({
        target: { tabId },
        func: fillConfiguredFields,
        args: [fields],
    });
}

async function fillConfiguredFields(fields: AttendanceField[]): Promise<void> {
    const SELECT_OPTION_TIMEOUT_MS = 15_000;
    const ELEMENT_TIMEOUT_MS = 10_000;
    const VALUE_RETRY_COUNT = 5;
    const VALUE_RETRY_DELAY_MS = 250;

    const sleep = (milliseconds: number): Promise<void> =>
        new Promise((resolve) => window.setTimeout(resolve, milliseconds));

    const waitForElement = (selector: string): Promise<Element | null> =>
        new Promise((resolve) => {
            const existing = document.querySelector(selector);
            if (existing) {
                resolve(existing);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (!element) {
                    return;
                }

                window.clearTimeout(timeoutId);
                observer.disconnect();
                resolve(element);
            });
            const timeoutId = window.setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, ELEMENT_TIMEOUT_MS);

            observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
            });
        });

    const waitForSelectOption = (
        selector: string,
        value: string,
    ): Promise<HTMLSelectElement | null> =>
        new Promise((resolve) => {
            const findSelect = (): HTMLSelectElement | null => {
                const candidate = document.querySelector(selector);
                if (!(candidate instanceof HTMLSelectElement)) {
                    return null;
                }

                const hasOption = [...candidate.options].some(
                    (option) => option.value === value,
                );
                return hasOption ? candidate : null;
            };

            const existing = findSelect();
            if (existing) {
                resolve(existing);
                return;
            }

            const observer = new MutationObserver(() => {
                const select = findSelect();
                if (!select) {
                    return;
                }

                window.clearTimeout(timeoutId);
                observer.disconnect();
                resolve(select);
            });
            const timeoutId = window.setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, SELECT_OPTION_TIMEOUT_MS);

            observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
            });
        });

    const dispatchValueEvents = (element: Element): void => {
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
        element.dispatchEvent(new Event("blur", { bubbles: true }));
    };

    const setNativeValue = (
        element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
        value: string,
    ): void => {
        const prototype = Object.getPrototypeOf(element) as object;
        const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

        if (descriptor?.set) {
            descriptor.set.call(element, value);
        } else {
            element.value = value;
        }
    };

    const setElementValue = async (
        element: Element,
        value: string,
        selector: string,
    ): Promise<void> => {
        if (
            element instanceof HTMLInputElement &&
            ["checkbox", "radio"].includes(element.type)
        ) {
            element.checked = ["true", "1", "yes", "on"].includes(
                value.toLowerCase(),
            );
            dispatchValueEvents(element);
            return;
        }

        if (element instanceof HTMLSelectElement) {
            for (let attempt = 0; attempt < VALUE_RETRY_COUNT; attempt += 1) {
                const latestSelect = await waitForSelectOption(selector, value);
                if (!latestSelect) {
                    throw new Error(
                        `드롭다운에서 '${value}' 옵션을 찾지 못했습니다.`,
                    );
                }

                setNativeValue(latestSelect, value);
                dispatchValueEvents(latestSelect);
                await sleep(VALUE_RETRY_DELAY_MS);

                const currentSelect = document.querySelector(selector);
                if (
                    currentSelect instanceof HTMLSelectElement &&
                    currentSelect.value === value
                ) {
                    return;
                }
            }

            throw new Error(`드롭다운에서 '${value}' 값을 선택하지 못했습니다.`);
        }

        if (
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLInputElement
        ) {
            setNativeValue(element, value);
            dispatchValueEvents(element);
            return;
        }

        element.textContent = value;
        dispatchValueEvents(element);
    };

    for (const field of fields) {
        if (!field.selector) {
            continue;
        }

        const delaySeconds = Math.max(field.delaySeconds, 0);
        if (delaySeconds > 0) {
            await sleep(delaySeconds * 1000);
        }

        const element = await waitForElement(field.selector);
        if (element) {
            await setElementValue(element, field.value, field.selector);
        }
    }
}
