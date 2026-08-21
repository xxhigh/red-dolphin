const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export interface UnitPeriod {
    number: number;
    startDate: string;
    endDate: string;
    startLabel: string;
    endLabel: string;
}

export interface UnitPeriodProgress {
    period: UnitPeriod;
    remainingDays: number;
    totalDays: number;
    remainingPercent: number;
}

export const UNIT_PERIODS: UnitPeriod[] = [
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

function parseDateKey(dateKey: string): number {
    const [year, month, day] = dateKey.split("-").map(Number);
    return Date.UTC(year, month - 1, day) / MILLISECONDS_PER_DAY;
}

function toLocalDayNumber(date: Date): number {
    return (
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) /
        MILLISECONDS_PER_DAY
    );
}

export function getUnitPeriodProgress(
    date: Date,
): UnitPeriodProgress | null {
    const currentDay = toLocalDayNumber(date);
    const period = UNIT_PERIODS.find((candidate) => {
        const startDay = parseDateKey(candidate.startDate);
        const endDay = parseDateKey(candidate.endDate);
        return currentDay >= startDay && currentDay <= endDay;
    });

    if (!period) {
        return null;
    }

    const startDay = parseDateKey(period.startDate);
    const endDay = parseDateKey(period.endDate);
    const totalDays = endDay - startDay;
    const remainingDays = Math.max(0, endDay - currentDay);

    return {
        period,
        remainingDays,
        totalDays,
        remainingPercent:
            totalDays === 0 ? 0 : (remainingDays / totalDays) * 100,
    };
}
