export const ATTENDANCE_TARGET_URL = "https://auth.skala-ai.com";

export interface RunAttendanceMessage {
    type: "runAttendance";
}

export interface RunAttendanceResponse {
    ok: boolean;
    error?: string;
}

export function isRunAttendanceMessage(
    message: unknown,
): message is RunAttendanceMessage {
    return (
        typeof message === "object" &&
        message !== null &&
        "type" in message &&
        message.type === "runAttendance"
    );
}
