<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import {
    CLASS_OPTIONS,
    DEFAULT_USER_SETTINGS,
    normalizeMeetingCode,
    parseUserSettings,
    parseZoomLinks,
    type ClassGroup,
    type UserSettings,
    type ZoomLink,
} from "../shared/settings";

const userName = ref("");
const classGroup = ref<ClassGroup | "">("");
const userId = ref("");
const saved = ref(false);
const saving = ref(false);
const saveError = ref(false);
const zoomLinks = ref<ZoomLink[]>([]);
const zoomDialog = ref<HTMLDialogElement | null>(null);
const zoomNicknameInput = ref<HTMLInputElement | null>(null);
const editingZoomId = ref<string | null>(null);
const zoomNickname = ref("");
const zoomMeetingCode = ref("");
const zoomSaving = ref(false);
const zoomDialogError = ref("");
const zoomStatus = ref("");
const zoomStatusError = ref(false);

onMounted(async () => {
    try {
        const stored = await chrome.storage.sync.get({
            userSettings: DEFAULT_USER_SETTINGS,
            zoomLinks: [],
        });
        const settings = parseUserSettings(stored.userSettings);
        userName.value = settings.userName;
        classGroup.value = settings.classGroup;
        userId.value = settings.userId;
        zoomLinks.value = parseZoomLinks(stored.zoomLinks);
    } catch {
        saveError.value = true;
    }
});

async function save(): Promise<void> {
    saving.value = true;
    saved.value = false;
    saveError.value = false;

    try {
        const userSettings: UserSettings = {
            userName: userName.value.trim(),
            classGroup: classGroup.value,
            userId: userId.value.trim(),
        };
        await chrome.storage.sync.set({ userSettings });
        saved.value = true;
        window.setTimeout(() => {
            saved.value = false;
        }, 1500);
    } catch {
        saveError.value = true;
    } finally {
        saving.value = false;
    }
}

function resetZoomForm(): void {
    editingZoomId.value = null;
    zoomNickname.value = "";
    zoomMeetingCode.value = "";
    zoomDialogError.value = "";
}

async function focusZoomNickname(): Promise<void> {
    await nextTick();
    zoomNicknameInput.value?.focus();
}

function openAddZoomDialog(): void {
    resetZoomForm();
    zoomDialog.value?.showModal();
    void focusZoomNickname();
}

function openEditZoomDialog(link: ZoomLink): void {
    editingZoomId.value = link.id;
    zoomNickname.value = link.nickname;
    zoomMeetingCode.value = link.meetingCode;
    zoomDialogError.value = "";
    zoomDialog.value?.showModal();
    void focusZoomNickname();
}

function closeZoomDialog(): void {
    zoomDialog.value?.close();
}

function handleZoomDialogClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
        closeZoomDialog();
    }
}

async function saveZoomLink(): Promise<void> {
    const nickname = zoomNickname.value.trim();
    const meetingCode = normalizeMeetingCode(zoomMeetingCode.value);

    if (!nickname) {
        zoomDialogError.value = "별명을 입력해 주세요.";
        return;
    }

    if (!meetingCode) {
        zoomDialogError.value = "미팅 코드는 숫자만 입력해 주세요.";
        return;
    }

    zoomSaving.value = true;
    zoomDialogError.value = "";

    const nextLinks = editingZoomId.value
        ? zoomLinks.value.map((link) =>
              link.id === editingZoomId.value
                  ? { ...link, nickname, meetingCode }
                  : link,
          )
        : [
              ...zoomLinks.value,
              {
                  id: crypto.randomUUID(),
                  nickname,
                  meetingCode,
              },
          ];

    try {
        await chrome.storage.sync.set({ zoomLinks: nextLinks });
        zoomLinks.value = nextLinks;
        zoomStatus.value = editingZoomId.value
            ? "Zoom 링크를 수정했습니다."
            : "Zoom 링크를 추가했습니다.";
        zoomStatusError.value = false;
        closeZoomDialog();
    } catch {
        zoomDialogError.value =
            "Zoom 링크를 저장하지 못했습니다. 다시 시도해 주세요.";
    } finally {
        zoomSaving.value = false;
    }
}

async function removeZoomLink(id: string): Promise<void> {
    const nextLinks = zoomLinks.value.filter((link) => link.id !== id);

    try {
        await chrome.storage.sync.set({ zoomLinks: nextLinks });
        zoomLinks.value = nextLinks;
        zoomStatus.value = "Zoom 링크를 삭제했습니다.";
        zoomStatusError.value = false;
    } catch {
        zoomStatus.value =
            "Zoom 링크를 삭제하지 못했습니다. 다시 시도해 주세요.";
        zoomStatusError.value = true;
    }
}
</script>

<template>
    <main class="panel options">
        <header class="brand-lockup">
            <div class="brand-identity">
                <p class="wordmark">
                    Red Dolphin<span class="brand-mark">.</span>
                </p>
                <span class="product-label">for SKALA</span>
            </div>
        </header>

        <div class="page-heading">
            <div>
                <p class="eyebrow">설정</p>
                <h1>대시보드</h1>
            </div>
            <p class="intro">설정 변경 후 저장을 눌러주세요.</p>
        </div>

        <section
            class="settings-section"
            aria-labelledby="user-settings-heading"
        >
            <div class="settings-heading">
                <h2 id="user-settings-heading">사용자 정보</h2>
                <p>교육생 정보를 입력해 주세요.</p>
            </div>

            <form class="user-settings-form" @submit.prevent="save">
                <label class="form-field">
                    <span>사용자 이름</span>
                    <input
                        v-model="userName"
                        class="form-control"
                        type="text"
                        name="userName"
                        autocomplete="name"
                        placeholder="이름을 입력하세요"
                        maxlength="50"
                        required
                    />
                </label>

                <label class="form-field">
                    <span>사용자 반</span>
                    <select
                        v-model="classGroup"
                        class="form-control"
                        name="classGroup"
                        required
                    >
                        <option disabled value="">반을 선택하세요</option>
                        <option
                            v-for="option in CLASS_OPTIONS"
                            :key="option"
                            :value="option"
                        >
                            {{ option }}
                        </option>
                    </select>
                </label>

                <label class="form-field">
                    <span>사용자 고유번호</span>
                    <input
                        v-model="userId"
                        class="form-control"
                        type="text"
                        name="userId"
                        autocomplete="off"
                        placeholder="U001"
                        maxlength="20"
                        required
                    />
                </label>

                <div class="actions form-actions">
                    <button
                        type="submit"
                        :disabled="saving"
                        :data-state="
                            saving
                                ? 'loading'
                                : saveError
                                  ? 'error'
                                  : saved
                                    ? 'success'
                                    : undefined
                        "
                    >
                        {{
                            saving
                                ? "저장 중"
                                : saveError
                                  ? "다시 저장"
                                  : saved
                                    ? "저장됨"
                                    : "정보 저장"
                        }}
                    </button>
                    <span
                        class="save-status"
                        :class="{ error: saveError }"
                        aria-live="polite"
                    >
                        {{
                            saveError
                                ? "저장하지 못했습니다. 다시 시도해 주세요."
                                : saved
                                  ? "✓ 사용자 정보를 저장했습니다."
                                  : ""
                        }}
                    </span>
                </div>
            </form>
        </section>

        <section
            class="settings-section zoom-settings-section"
            aria-labelledby="zoom-settings-heading"
        >
            <div class="section-toolbar">
                <div class="settings-heading">
                    <h2 id="zoom-settings-heading">Zoom 설정</h2>
                    <p>자주 사용하는 Zoom 미팅 코드를 관리합니다.</p>
                </div>
                <button
                    class="secondary-button"
                    type="button"
                    @click="openAddZoomDialog"
                >
                    + Zoom 링크 추가
                </button>
            </div>

            <p v-if="zoomLinks.length === 0" class="empty-state">
                등록된 Zoom 링크가 없습니다. 링크를 추가해 주세요.
            </p>

            <ul v-else class="zoom-settings-list">
                <li
                    v-for="link in zoomLinks"
                    :key="link.id"
                    class="zoom-settings-item"
                >
                    <div class="zoom-settings-copy">
                        <strong>{{ link.nickname }}</strong>
                        <span>미팅 코드 {{ link.meetingCode }}</span>
                    </div>
                    <div class="zoom-item-actions">
                        <button
                            class="text-button"
                            type="button"
                            @click="openEditZoomDialog(link)"
                        >
                            수정
                        </button>
                        <button
                            class="text-button danger-button"
                            type="button"
                            @click="removeZoomLink(link.id)"
                        >
                            삭제
                        </button>
                    </div>
                </li>
            </ul>

            <p
                class="zoom-status"
                :class="{ error: zoomStatusError }"
                aria-live="polite"
            >
                {{ zoomStatus }}
            </p>
        </section>

        <dialog
            ref="zoomDialog"
            class="zoom-dialog"
            aria-labelledby="zoom-dialog-title"
            @click="handleZoomDialogClick"
            @close="resetZoomForm"
        >
            <form class="zoom-dialog-content" @submit.prevent="saveZoomLink">
                <header class="dialog-heading">
                    <div>
                        <p class="eyebrow">Zoom 링크</p>
                        <h2 id="zoom-dialog-title">
                            {{ editingZoomId ? "링크 수정" : "새 링크 추가" }}
                        </h2>
                    </div>
                    <button
                        class="dialog-close-button"
                        type="button"
                        aria-label="팝업 닫기"
                        @click="closeZoomDialog"
                    >
                        ×
                    </button>
                </header>

                <div class="dialog-fields">
                    <label class="form-field">
                        <span>별명</span>
                        <input
                            ref="zoomNicknameInput"
                            v-model="zoomNickname"
                            class="form-control"
                            type="text"
                            name="zoomNickname"
                            autocomplete="off"
                            placeholder="별명을 입력하세요"
                            maxlength="50"
                            :aria-invalid="zoomDialogError ? 'true' : undefined"
                            aria-describedby="zoom-dialog-error"
                            required
                        />
                    </label>

                    <label class="form-field">
                        <span>미팅 코드</span>
                        <input
                            v-model="zoomMeetingCode"
                            class="form-control"
                            type="text"
                            name="zoomMeetingCode"
                            inputmode="numeric"
                            autocomplete="off"
                            placeholder="미팅 코드를 입력하세요"
                            maxlength="30"
                            :aria-invalid="zoomDialogError ? 'true' : undefined"
                            aria-describedby="zoom-dialog-error"
                            required
                        />
                    </label>
                </div>

                <p
                    id="zoom-dialog-error"
                    class="dialog-error"
                    aria-live="polite"
                >
                    {{ zoomDialogError }}
                </p>

                <footer class="dialog-actions">
                    <button
                        class="secondary-button"
                        type="button"
                        @click="closeZoomDialog"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        :disabled="zoomSaving"
                        :data-state="zoomSaving ? 'loading' : undefined"
                    >
                        {{
                            zoomSaving
                                ? "저장 중"
                                : editingZoomId
                                  ? "변경 저장"
                                  : "링크 추가"
                        }}
                    </button>
                </footer>
            </form>
        </dialog>
    </main>
</template>
