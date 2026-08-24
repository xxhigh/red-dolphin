<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import {
    DEFAULT_USER_SETTINGS,
    parseUserSettings,
    parseZoomLinks,
    type UserSettings,
    type ZoomLink,
} from "../shared/settings";
import { findClassInfo } from "../shared/timetable";
import { getUnitPeriodProgress } from "../shared/unitPeriods";
import type {
    RunAttendanceMessage,
    RunAttendanceResponse,
} from "../shared/attendance";

const zoomLinks = ref<ZoomLink[]>([]);
const userSettings = ref<UserSettings>(DEFAULT_USER_SETTINGS);
const zoomLoading = ref(true);
const zoomLoadError = ref("");
const zoomOpenError = ref("");
const attendanceRunning = ref(false);
const attendanceError = ref("");
const classTitleElement = ref<HTMLElement | null>(null);
const isClassTitleOverflowing = ref(false);
const today = new Date();

const todayClassInfo = computed(() =>
    findClassInfo(today, userSettings.value.classGroup),
);
const unitPeriodProgress = computed(() => getUnitPeriodProgress(today));
const unitPeriodCountdown = computed(() => {
    const remainingDays = unitPeriodProgress.value?.remainingDays;

    if (remainingDays === undefined) {
        return "기간 외";
    }

    return remainingDays === 0 ? "D-Day" : `D-${remainingDays}`;
});
const classTitle = computed(
    () =>
        todayClassInfo.value.entry?.subject ?? "오늘은 예정된 수업이 없습니다",
);
const mainProfessorLabel = computed(() => {
    const professor = todayClassInfo.value.mainProfessor?.professor;
    return professor ? `메인 · ${professor}` : "교수 정보 없음";
});
const professorTooltip = computed(() => {
    const classGroup = userSettings.value.classGroup;

    if (!classGroup) {
        return "설정에서 사용자 반을 선택하면 실습 교수님을 확인할 수 있습니다.";
    }

    const practicalProfessor =
        todayClassInfo.value.practicalProfessor?.professor;
    if (practicalProfessor) {
        return `${classGroup} 실습 · ${practicalProfessor} 교수님`;
    }

    if (todayClassInfo.value.selectedClassIsMain) {
        return `${classGroup}은 메인 교수님이 직접 진행합니다.`;
    }

    return `${classGroup} 실습 교수 정보가 없습니다.`;
});

async function updateClassTitleOverflow(): Promise<void> {
    isClassTitleOverflowing.value = false;
    await nextTick();

    const element = classTitleElement.value;
    isClassTitleOverflowing.value = Boolean(
        element && element.scrollWidth > element.clientWidth + 1,
    );
}

watch(classTitle, () => {
    void updateClassTitleOverflow();
});

onMounted(async () => {
    try {
        const stored = await chrome.storage.sync.get({
            userSettings: DEFAULT_USER_SETTINGS,
            zoomLinks: [],
        });
        userSettings.value = parseUserSettings(stored.userSettings);
        zoomLinks.value = parseZoomLinks(stored.zoomLinks);
    } catch {
        zoomLoadError.value = "Zoom 링크를 불러오지 못했습니다.";
    } finally {
        zoomLoading.value = false;
    }

    await updateClassTitleOverflow();
    void document.fonts.ready.then(updateClassTitleOverflow);
});

function openSettings(): void {
    void chrome.runtime.openOptionsPage();
}

function formatZoomIndex(index: number): string {
    return String(index + 1).padStart(2, "0");
}

async function runAttendance(): Promise<void> {
    attendanceRunning.value = true;
    attendanceError.value = "";

    try {
        const response = await chrome.runtime.sendMessage<
            RunAttendanceMessage,
            RunAttendanceResponse
        >({ type: "runAttendance" });
        if (!response?.ok) {
            attendanceError.value =
                response?.error ?? "출석 페이지를 열지 못했습니다.";
        }
    } catch {
        attendanceError.value = "출석 페이지를 열지 못했습니다.";
    } finally {
        attendanceRunning.value = false;
    }
}

async function openZoomMeeting(link: ZoomLink): Promise<void> {
    zoomOpenError.value = "";

    try {
        await chrome.tabs.create({
            url: `https://zoom.us/j/${link.meetingCode}`,
        });
    } catch {
        zoomOpenError.value = "Zoom 미팅을 열지 못했습니다.";
    }
}

const openStudentPage = async () => {
    try {
        await chrome.tabs.create({
            url: `https://student.skala-ai.com/`,
        });
    } catch {
        console.log("Student 링크를 열지 못했습니다.");
    }
};
</script>

<template>
    <main class="panel popup">
        <header class="brand-lockup">
            <div class="brand-identity">
                <p class="wordmark">
                    Red Dolphin<span class="brand-mark">.</span>
                </p>
                <span class="product-label">for SKALA</span>
            </div>
            <button
                class="settings-button"
                type="button"
                aria-label="설정 열기"
                @click="openSettings"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" />
                    <path
                        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"
                    />
                </svg>
            </button>
        </header>

        <section class="summary-card" aria-label="사용자 및 오늘의 수업 정보">
            <div class="summary-row user-summary">
                <strong class="user-name">
                    {{ userSettings.userName || "설정이 필요합니다" }}
                </strong>
                <span class="summary-detail">
                    {{ userSettings.classGroup || "반 미설정" }}
                </span>
            </div>
            <div class="summary-row class-summary">
                <strong
                    ref="classTitleElement"
                    class="class-title"
                    :class="{ 'is-marquee': isClassTitleOverflowing }"
                    :title="classTitle"
                >
                    <span class="class-title-track">
                        <span class="class-title-copy">{{ classTitle }}</span>
                        <span
                            v-if="isClassTitleOverflowing"
                            class="class-title-copy"
                            aria-hidden="true"
                        >
                            {{ classTitle }}
                        </span>
                    </span>
                </strong>
                <span
                    v-if="todayClassInfo.mainProfessor"
                    class="professor-tooltip"
                >
                    <span
                        class="professor-name professor-trigger"
                        tabindex="0"
                        aria-describedby="professor-tooltip"
                    >
                        {{ mainProfessorLabel }}
                    </span>
                    <span
                        id="professor-tooltip"
                        class="tooltip-bubble"
                        role="tooltip"
                    >
                        {{ professorTooltip }}
                    </span>
                </span>
                <span v-else class="professor-name">
                    {{ mainProfessorLabel }}
                </span>
            </div>
        </section>

        <section class="quick-actions" aria-label="주요 바로가기">
            <button
                class="quick-link primary-action"
                type="button"
                :disabled="attendanceRunning"
                :data-state="attendanceRunning ? 'loading' : undefined"
                @click="runAttendance"
            >
                <span>{{ attendanceRunning ? "페이지 여는 중" : "출석체크" }}</span>
                <span class="link-arrow" aria-hidden="true">↗</span>
            </button>
            <button
                class="quick-link secondary-action"
                type="button"
                @click="openStudentPage"
            >
                <span>교육생 포털</span>
                <span class="link-arrow" aria-hidden="true">↗</span>
            </button>
            <p
                v-if="attendanceError"
                class="quick-action-error"
                role="status"
            >
                {{ attendanceError }}
            </p>
        </section>

        <section class="zoom-section" aria-labelledby="zoom-heading">
            <div class="section-heading">
                <h2 id="zoom-heading">Zoom 강의실</h2>
                <p>접속할 방을 선택하세요.</p>
            </div>
            <p v-if="zoomLoading" class="zoom-feedback">
                Zoom 링크를 불러오는 중…
            </p>
            <p
                v-else-if="zoomLoadError"
                class="zoom-feedback error"
                role="status"
            >
                {{ zoomLoadError }}
            </p>
            <p v-else-if="zoomLinks.length === 0" class="zoom-feedback">
                설정에서 Zoom 링크를 추가해 주세요.
            </p>
            <div v-else class="zoom-grid">
                <button
                    v-for="(link, index) in zoomLinks"
                    :key="link.id"
                    class="zoom-link"
                    type="button"
                    :aria-label="`${link.nickname} Zoom 미팅 열기`"
                    @click="openZoomMeeting(link)"
                >
                    <span class="room-index">{{ formatZoomIndex(index) }}</span>
                    <span class="zoom-link-name">{{ link.nickname }}</span>
                    <span aria-hidden="true">↗</span>
                </button>
            </div>
            <p v-if="zoomOpenError" class="zoom-open-error" role="status">
                {{ zoomOpenError }}
            </p>
        </section>

        <footer class="period-footer">
            <div
                v-if="unitPeriodProgress"
                class="period-progress-tooltip"
            >
                <div
                    class="period-progress-content"
                    tabindex="0"
                    :aria-label="`${unitPeriodProgress.period.number}차 단위기간, 종료일까지 ${unitPeriodProgress.remainingDays}일, 출석일 ${unitPeriodProgress.remainingAttendanceDays}일 남음`"
                    aria-describedby="period-progress-tooltip"
                >
                    <div class="period-progress-heading">
                        <span>
                            {{ unitPeriodProgress.period.number }}차 단위기간
                        </span>
                        <strong>
                            {{ unitPeriodCountdown }} · 출석
                            {{ unitPeriodProgress.remainingAttendanceDays }}일
                        </strong>
                    </div>
                    <div
                        class="period-progress-track"
                        role="progressbar"
                        aria-label="단위기간 진행률"
                        aria-valuemin="0"
                        :aria-valuemax="unitPeriodProgress.totalDays"
                        :aria-valuenow="unitPeriodProgress.elapsedDays"
                    >
                        <span
                            class="period-progress-fill"
                            :style="{
                                width: `${unitPeriodProgress.elapsedPercent}%`,
                            }"
                        />
                    </div>
                </div>
                <div
                    id="period-progress-tooltip"
                    class="period-tooltip-bubble"
                    role="tooltip"
                >
                    <strong>
                        {{ unitPeriodProgress.period.number }}차 단위기간
                    </strong>
                    <span>
                        시작일 {{ unitPeriodProgress.period.startLabel }}
                    </span>
                    <span>
                        종료일 {{ unitPeriodProgress.period.endLabel }}
                    </span>
                    <span>
                        남은 일수 {{ unitPeriodProgress.remainingDays }}일
                    </span>
                    <span>
                        남은 출석일
                        {{ unitPeriodProgress.remainingAttendanceDays }}일
                    </span>
                </div>
            </div>
            <p v-else class="period-outside-message">
                현재 진행 중인 단위기간이 없습니다.
            </p>
        </footer>
    </main>
</template>
