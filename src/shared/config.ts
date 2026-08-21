import type { ClassGroup } from "./settings";

interface UnitPeriodConfig {
    number: number;
    startDate: string;
    endDate: string;
    startLabel: string;
    endLabel: string;
}

const CLASS_SELECT_VALUES: Record<ClassGroup, string> = {
    "1반": "15",
    "2반": "16",
    "3반": "17",
    "4반": "18",
};

const UNIT_PERIODS: UnitPeriodConfig[] = [
    {
        number: 1,
        startDate: "2026-07-14",
        endDate: "2026-08-13",
        startLabel: "2026.07.14(화)",
        endLabel: "2026.08.13(목)",
    },
    {
        number: 2,
        startDate: "2026-08-14",
        endDate: "2026-09-13",
        startLabel: "2026.08.14(금)",
        endLabel: "2026.09.13(일)",
    },
    {
        number: 3,
        startDate: "2026-09-14",
        endDate: "2026-10-13",
        startLabel: "2026.09.14(월)",
        endLabel: "2026.10.13(화)",
    },
    {
        number: 4,
        startDate: "2026-10-14",
        endDate: "2026-11-13",
        startLabel: "2026.10.14(수)",
        endLabel: "2026.11.13(금)",
    },
    {
        number: 5,
        startDate: "2026-11-14",
        endDate: "2026-12-11",
        startLabel: "2026.11.14(토)",
        endLabel: "2026.12.11(금)",
    },
];

export const APP_CONFIG = {
    urls: {
        attendance: "https://auth.skala-ai.com",
        studentPortal: "https://student.skala-ai.com/",
        zoomMeetingBase: "https://zoom.us/j/",
    },
    attendance: {
        campusCode: "US",
        mobileUserAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.0.0 Mobile/15E148 Safari/604.1",
        userAgentRuleId: 1001,
        classSelectValues: CLASS_SELECT_VALUES,
        selectors: {
            userName: "input[class='auth-input']",
            campus:
                "#app > div > div > div.auth-form > div:nth-child(2) > div > select",
            classGroup:
                "#app > div > div > div.auth-form > div:nth-child(3) > div > select",
        },
        timing: {
            pageLoadTimeoutMs: 30_000,
            elementTimeoutMs: 10_000,
            selectOptionTimeoutMs: 15_000,
            valueRetryCount: 5,
            valueRetryDelayMs: 250,
        },
    },
    timetable: {
        sourceFile: "time-table.json",
        unitPeriods: UNIT_PERIODS,
    },
} as const;
