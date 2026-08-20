<script setup lang="ts">
import { onMounted, ref } from "vue";

const enabled = ref(true);
const saved = ref(false);
onMounted(async () => {
    const settings = await chrome.storage.sync.get({ enabled: true });
    enabled.value = typeof settings.enabled === "boolean" ? settings.enabled : true;
});
async function save(): Promise<void> {
    await chrome.storage.sync.set({ enabled: enabled.value });
    saved.value = true;
    window.setTimeout(() => { saved.value = false; }, 1500);
}
</script>

<template>
    <main class="panel options">
        <p class="eyebrow">Red Dolphin</p><h1>설정</h1>
        <label class="setting-row"><span><strong>확장 프로그램 사용</strong><small>백그라운드 기능의 동작 여부를 설정합니다.</small></span><input v-model="enabled" type="checkbox" /></label>
        <div class="actions"><button type="button" @click="save">저장</button><span aria-live="polite">{{ saved ? "저장했습니다." : "" }}</span></div>
    </main>
</template>
