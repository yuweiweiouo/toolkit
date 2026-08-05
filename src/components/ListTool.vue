<script setup lang="ts">
import { computed, ref } from 'vue';
import { ArrowDownAZ, ArrowUpAZ, Check, Copy, Download, Eraser, List, RotateCcw, Sparkles, Trash2 } from 'lucide-vue-next';
import ToolHeader from './ToolHeader.vue';
import { copyText, downloadText } from '../utils';

type SortOrder = 'original' | 'ascending' | 'descending';

const emit = defineEmits<{ notice: [message: string, type?: 'success' | 'info' | 'error'] }>();
const input = ref('');
const sortOrder = ref<SortOrder>('original');
const removeDuplicates = ref(true);
const removeEmpty = ref(true);
const trimItems = ref(true);
const caseSensitive = ref(true);
const copied = ref(false);

const sourceLines = computed(() => input.value ? input.value.split(/\r?\n/) : []);
const processedItems = computed(() => {
  let items = sourceLines.value.map((item) => (trimItems.value ? item.trim() : item));
  if (removeEmpty.value) items = items.filter(Boolean);

  if (removeDuplicates.value) {
    const seen = new Set<string>();
    items = items.filter((item) => {
      const comparisonValue = caseSensitive.value ? item : item.toLowerCase();
      if (seen.has(comparisonValue)) return false;
      seen.add(comparisonValue);
      return true;
    });
  }

  if (sortOrder.value === 'ascending') {
    items.sort((left, right) => compareItems(left, right));
  } else if (sortOrder.value === 'descending') {
    items.sort((left, right) => compareItems(right, left));
  }
  return items;
});

const output = computed(() => processedItems.value.join('\n'));
const duplicateCount = computed(() => {
  const normalized = sourceLines.value.map((item) => (trimItems.value ? item.trim() : item)).filter((item) => removeEmpty.value ? Boolean(item) : true);
  return Math.max(0, normalized.length - new Set(normalized.map((item) => caseSensitive.value ? item : item.toLowerCase())).size);
});
const emptyCount = computed(() => removeEmpty.value ? sourceLines.value.filter((item) => !item.trim()).length : 0);

function compareItems(left: string, right: string): number {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: caseSensitive.value ? 'variant' : 'base' });
}

async function copyResult(): Promise<void> {
  try {
    await copyText(output.value);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 1500);
    emit('notice', `已複製 ${processedItems.value.length} 筆清單`);
  } catch (error) {
    emit('notice', error instanceof Error ? error.message : '複製失敗', 'error');
  }
}

function downloadResult(): void {
  downloadText(`list-result-${processedItems.value.length}.txt`, output.value);
  emit('notice', '清單檔案已開始下載');
}

function clearInput(): void {
  input.value = '';
}

function restoreSample(): void {
  input.value = 'apple\nbanana\napple\ncherry\n\nbanana\ndurian';
}
</script>

<template>
  <div class="tool-page">
    <ToolHeader eyebrow="Developer / list" title="List 清單處理器" description="整理任何一行一筆的文字清單，支援去重、排序、清除空白與大小寫比對。">
      <template #actions>
        <div class="toolbar-actions"><button type="button" class="button button-light" @click="restoreSample"><RotateCcw :size="14" />載入範例</button><button type="button" class="button button-dark" @click="clearInput"><Trash2 :size="14" />清空</button></div>
      </template>
    </ToolHeader>

    <section class="panel list-control-panel">
      <div class="list-control-heading"><div><span class="eyebrow">Transform / options</span><h2>清單處理選項</h2></div><span class="list-stats">原始 {{ sourceLines.length }} 行 · 輸出 {{ processedItems.length }} 行</span></div>
      <div class="list-options-grid">
        <label class="check-row"><input v-model="removeDuplicates" type="checkbox" />移除重複項目 <small v-if="duplicateCount">({{ duplicateCount }} 筆)</small></label>
        <label class="check-row"><input v-model="removeEmpty" type="checkbox" />移除空白行 <small v-if="emptyCount">({{ emptyCount }} 行)</small></label>
        <label class="check-row"><input v-model="trimItems" type="checkbox" />移除前後空白</label>
        <label class="check-row"><input v-model="caseSensitive" type="checkbox" />區分大小寫</label>
      </div>
      <div class="list-sort-row"><span>排序方式</span><div class="segmented list-sort-buttons"><button type="button" :class="{ selected: sortOrder === 'original' }" @click="sortOrder = 'original'">原始順序</button><button type="button" :class="{ selected: sortOrder === 'ascending' }" @click="sortOrder = 'ascending'"><ArrowDownAZ :size="14" />升冪 A → Z</button><button type="button" :class="{ selected: sortOrder === 'descending' }" @click="sortOrder = 'descending'"><ArrowUpAZ :size="14" />降冪 Z → A</button></div></div>
    </section>

    <div class="editor-grid list-editor-grid">
      <section class="panel editor-panel list-editor-panel"><div class="editor-heading"><span><List :size="15" /> 原始清單</span><small>每行一筆 · {{ sourceLines.length }} 行</small></div><textarea v-model="input" placeholder="貼上清單，每行一筆..." /></section>
      <section class="panel editor-panel list-editor-panel"><div class="editor-heading list-result-heading"><span><Sparkles :size="15" /> 處理後清單</span><div><small>{{ processedItems.length }} 行</small><button type="button" class="icon-button" :disabled="!output" title="複製清單" @click="copyResult"><Check v-if="copied" :size="15" class="success-icon" /><Copy v-else :size="15" /></button><button type="button" class="icon-button" :disabled="!output" title="下載清單" @click="downloadResult"><Download :size="15" /></button></div></div><textarea v-model="output" readonly placeholder="處理後的清單會顯示於此..." /></section>
    </div>

    <div class="list-footer-note"><Eraser :size="14" />去重與排序會即時套用，原始內容不會被覆蓋。</div>
  </div>
</template>
