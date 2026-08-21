import timeTableData from "./time-table.json";
import type { ClassGroup } from "./settings";

interface TimetableClass {
    room: string;
    classNumber: number;
    professor: string;
    isMainProfessor: boolean;
}

export interface TimetableEntry {
    date: string;
    day: string;
    week: number | null;
    subject: string | null;
    classes: TimetableClass[];
    notes?: string[];
}

interface TimetableData {
    entries: TimetableEntry[];
}

export interface TodayClassInfo {
    entry: TimetableEntry | null;
    mainProfessor: TimetableClass | null;
    practicalProfessor: TimetableClass | null;
    selectedClassIsMain: boolean;
}

const timetable = timeTableData as TimetableData;

export function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function findClassInfo(
    date: Date,
    classGroup: ClassGroup | "",
): TodayClassInfo {
    const dateKey = formatLocalDate(date);
    const entry =
        timetable.entries.find((candidate) => candidate.date === dateKey) ??
        null;
    const mainProfessor =
        entry?.classes.find((item) => item.isMainProfessor) ?? null;
    const classNumber = classGroup ? Number.parseInt(classGroup, 10) : null;
    const selectedProfessor =
        classNumber === null
            ? null
            : (entry?.classes.find(
                  (item) => item.classNumber === classNumber,
              ) ?? null);

    return {
        entry,
        mainProfessor,
        practicalProfessor:
            selectedProfessor && !selectedProfessor.isMainProfessor
                ? selectedProfessor
                : null,
        selectedClassIsMain: selectedProfessor?.isMainProfessor ?? false,
    };
}
