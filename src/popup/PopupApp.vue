<script setup lang="ts">
import { onMounted, ref } from "vue";

const enabled = ref(true);
onMounted(async () => {
    const settings = await chrome.storage.sync.get({ enabled: true });
    enabled.value = typeof settings.enabled === "boolean" ? settings.enabled : true;
});
function openOptions(): void {
    void chrome.runtime.openOptionsPage();
}
</script>

<template>
    <main class="panel popup">
        <p class="eyebrow">SKALA helper</p>
        <h1>Red Dolphin</h1>
        <p class="status" :class="{ active: enabled }">{{ enabled ? "확장 프로그램이 활성화되어 있습니다." : "현재 비활성화 상태입니다." }}</p>
        <button type="button" @click="openOptions">설정 열기</button>
    </main>
</template>
