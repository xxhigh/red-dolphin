export const CLASS_OPTIONS = ["1반", "2반", "3반", "4반"] as const;

export type ClassGroup = (typeof CLASS_OPTIONS)[number];

export interface UserSettings {
    userName: string;
    classGroup: ClassGroup | "";
    userId: string;
}

export interface ZoomLink {
    id: string;
    nickname: string;
    meetingCode: string;
}

export interface ZoomLinksExport {
    format: "red-dolphin.zoom-links";
    version: 1;
    exportedAt: string;
    zoomLinks: ZoomLink[];
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
    userName: "",
    classGroup: "",
    userId: "",
};

function isClassGroup(value: unknown): value is ClassGroup {
    return (
        typeof value === "string" &&
        CLASS_OPTIONS.some((option) => option === value)
    );
}

export function normalizeMeetingCode(value: string): string | null {
    const normalized = value.replace(/[\s-]/g, "");
    return /^\d+$/.test(normalized) ? normalized : null;
}

export function parseUserSettings(value: unknown): UserSettings {
    if (typeof value !== "object" || value === null) {
        return DEFAULT_USER_SETTINGS;
    }

    const candidate = value as Record<string, unknown>;
    return {
        userName:
            typeof candidate.userName === "string" ? candidate.userName : "",
        classGroup: isClassGroup(candidate.classGroup)
            ? candidate.classGroup
            : "",
        userId: typeof candidate.userId === "string" ? candidate.userId : "",
    };
}

export function parseZoomLinks(value: unknown): ZoomLink[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((item) => {
        if (typeof item !== "object" || item === null) {
            return [];
        }

        const candidate = item as Record<string, unknown>;
        if (
            typeof candidate.id !== "string" ||
            typeof candidate.nickname !== "string" ||
            typeof candidate.meetingCode !== "string"
        ) {
            return [];
        }

        const id = candidate.id.trim();
        const nickname = candidate.nickname.trim();
        const meetingCode = normalizeMeetingCode(candidate.meetingCode);
        if (!id || !nickname || !meetingCode) {
            return [];
        }

        return [{ id, nickname, meetingCode }];
    });
}

export function createZoomLinksExport(
    zoomLinks: ZoomLink[],
    exportedAt = new Date(),
): ZoomLinksExport {
    return {
        format: "red-dolphin.zoom-links",
        version: 1,
        exportedAt: exportedAt.toISOString(),
        zoomLinks,
    };
}

export function parseZoomLinksExport(value: unknown): ZoomLink[] | null {
    if (typeof value !== "object" || value === null) {
        return null;
    }

    const candidate = value as Record<string, unknown>;
    if (
        candidate.format !== "red-dolphin.zoom-links" ||
        candidate.version !== 1 ||
        !Array.isArray(candidate.zoomLinks)
    ) {
        return null;
    }

    const zoomLinks = parseZoomLinks(candidate.zoomLinks);
    return zoomLinks.length === candidate.zoomLinks.length ? zoomLinks : null;
}
