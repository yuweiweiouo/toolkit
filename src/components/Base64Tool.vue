<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ArrowRightLeft, Check, Copy, Download, FileCode2, Upload } from 'lucide-vue-next';
import ToolHeader from './ToolHeader.vue';
import { copyText, decodeBase64Utf8, downloadText, encodeBase64Utf8 } from '../utils';

type Mode = 'encode' | 'decode';
const emit = defineEmits<{ notice: [message: string, type?: 'success' | 'info' | 'error'] }>();
const tab = ref<'text' | 'file'>('text');
const mode = ref<Mode>('encode');
const urlSafe = ref(false);
const input = ref('Hello, 和風 IT Tools!');
const output = ref('');
const error = ref('');
const copied = ref(false);
const file = ref<File | null>(null);
const fileData = ref('');

function processText(): void {
  error.value = '';
  if (!input.value.trim()) {
    output.value = '';
    return;
  }
  try {
    output.value = mode.value === 'encode' ? encodeBase64Utf8(input.value, urlSafe.value) : decodeBase64Utf8(input.value, urlSafe.value);
  } catch {
    output.value = '';
    error.value = '格式無效，無法進行 Base64 解碼。';
  }
}
watch([input, mode, urlSafe, tab], processText, { immediate: true });

const inputBytes = computed(() => new TextEncoder().encode(input.value).length);
const outputBytes = computed(() => new TextEncoder().encode(output.value).length);

function swap(): void {
  if (!output.value) return;
  input.value = output.value;
  mode.value = mode.value === 'encode' ? 'decode' : 'encode';
}

function handleFile(fileValue: File | undefined): void {
  if (!fileValue) return;
  file.value = fileValue;
  const reader = new FileReader();
  reader.addEventListener('load', () => (fileData.value = String(reader.result ?? '')));
  reader.readAsDataURL(fileValue);
}

async function copy(value: string): Promise<void> {
  if (!value) return;
  try {
    await copyText(value);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 1500);
    emit('notice', '已複製到剪貼簿');
  } catch (copyError) {
    emit('notice', copyError instanceof Error ? copyError.message : '複製失敗', 'error');
  }
}

function downloadResult(): void {
  const value = tab.value === 'text' ? output.value : fileData.value;
  if (!value) return;
  downloadText(`base64-result-${Date.now()}.txt`, value);
  emit('notice', '檔案已開始下載');
}
</script>

<template>
  <div class="tool-page">
    <ToolHeader title="Base64 工具" description="支援 UTF-8 文字編解碼、URL-safe 格式，以及檔案轉換 Data URI / Base64。">
      <template #actions>
        <div class="segmented tab-switcher">
          <button type="button" :class="{ selected: tab === 'text' }" @click="tab = 'text'">文字編解碼</button>
          <button type="button" :class="{ selected: tab === 'file' }" @click="tab = 'file'">檔案轉 Base64</button>
        </div>
      </template>
    </ToolHeader>

    <template v-if="tab === 'text'">
      <section class="panel base64-toolbar">
        <div class="toolbar-actions-left">
          <div class="segmented">
            <button type="button" :class="{ selected: mode === 'encode' }" @click="mode = 'encode'">編碼 Encode</button>
            <button type="button" :class="{ selected: mode === 'decode' }" @click="mode = 'decode'">解碼 Decode</button>
          </div>
          <label class="check-row"><input v-model="urlSafe" type="checkbox" /> URL-Safe 模式</label>
        </div>
        <button type="button" class="button button-light" :disabled="!output" @click="swap"><ArrowRightLeft :size="14" />對調輸入輸出</button>
      </section>
      <div class="editor-grid">
        <section class="panel editor-panel">
          <div class="editor-heading"><span>輸入數據 · {{ mode === 'encode' ? '明文' : 'Base64' }}</span><small>{{ input.length }} 字元 / {{ inputBytes }} Bytes</small></div>
          <textarea v-model="input" placeholder="在此輸入要處理的文字內容..." />
        </section>
        <section class="panel editor-panel">
          <div class="editor-heading"><span>轉換結果 · {{ mode === 'encode' ? 'Base64' : '解碼明文' }}</span><div><small>{{ output.length }} 字元 / {{ outputBytes }} Bytes</small><button type="button" class="icon-button" :disabled="!output" @click="copy(output)"><Check v-if="copied" :size="15" class="success-icon" /><Copy v-else :size="15" /></button><button type="button" class="icon-button" :disabled="!output" @click="downloadResult"><Download :size="15" /></button></div></div>
          <div v-if="error" class="editor-error">{{ error }}</div>
          <textarea v-else v-model="output" readonly placeholder="轉換結果將顯示於此..." />
        </section>
      </div>
    </template>

    <section v-else class="panel file-panel">
      <label class="drop-zone">
        <input type="file" @change="handleFile(($event.target as HTMLInputElement).files?.[0])" />
        <span class="upload-icon"><Upload :size="23" /></span>
        <strong>點擊上傳或拖曳檔案至此</strong>
        <small>支援圖片、文件、音訊等任何檔案格式</small>
      </label>
      <div v-if="file && fileData" class="file-result">
        <div class="file-meta"><div><strong>{{ file.name }}</strong><small>{{ (file.size / 1024).toFixed(1) }} KB · {{ file.type || 'Unknown' }}</small></div><div class="toolbar-actions"><button type="button" class="button button-dark" @click="copy(fileData)"><Copy :size="14" />複製 Data URI</button><button type="button" class="button button-light" @click="downloadResult"><Download :size="14" />下載文本</button></div></div>
        <div v-if="file.type.startsWith('image/')" class="image-preview"><img :src="fileData" :alt="file.name" /></div>
        <label class="field-group"><span>Base64 Data URI 字串</span><textarea v-model="fileData" readonly rows="7" /></label>
      </div>
      <div v-else class="file-hint"><FileCode2 :size="19" />檔案內容只會在你的瀏覽器中處理，不會上傳至伺服器。</div>
    </section>
  </div>
</template>
