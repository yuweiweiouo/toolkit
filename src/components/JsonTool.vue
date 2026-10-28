<script setup lang="ts">
import { computed, ref } from 'vue';
import { Braces, Check, ChevronsDownUp, ChevronsUpDown, Copy, ListTree, Minimize2, Sparkles, Trash2 } from 'lucide-vue-next';
import ToolHeader from './ToolHeader.vue';
import JsonNode from './JsonNode.vue';
import { copyText } from '../utils';

const SAMPLE_JSON = '{"id":1,"name":"Yuzi Toolkit","active":true,"score":9.5,"owner":null,"tags":["dev","json","tool"],"meta":{"created":"2026-10-28T13:33:49+08:00","links":[{"rel":"self","href":"https://example.com"}]}}';
const emit = defineEmits<{ notice: [message: string, type?: 'success' | 'info' | 'error'] }>();
const input = ref(SAMPLE_JSON);
const indent = ref(2);
const openAll = ref(true);
const treeKey = ref(0);
const copied = ref(false);

const parsed = computed<{ value?: unknown; error?: string }>(() => {
  if (!input.value.trim()) return {};
  try {
    return { value: JSON.parse(input.value) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'JSON 格式無效' };
  }
});

function rewrite(space: number): void {
  if (parsed.value.error) return emit('notice', 'JSON 格式錯誤，無法轉換', 'error');
  if (!input.value.trim()) return;
  input.value = JSON.stringify(parsed.value.value, null, space);
}

// 重新掛載樹，讓手動切換過的節點也一起套用展開/收合
function toggleAll(open: boolean): void {
  openAll.value = open;
  treeKey.value++;
}

async function copy(): Promise<void> {
  try {
    await copyText(input.value);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 1500);
    emit('notice', '已複製 JSON');
  } catch (error) {
    emit('notice', error instanceof Error ? error.message : '複製失敗', 'error');
  }
}
</script>

<template>
  <div class="tool-page">
    <ToolHeader title="JSON 編輯器" description="驗證、格式化與壓縮 JSON，並以樹狀結構展開或收合檢視。">
      <template #actions><div class="toolbar-actions"><button type="button" class="button button-light" @click="rewrite(indent)"><Sparkles :size="14" />Format</button><button type="button" class="button button-light" @click="rewrite(0)"><Minimize2 :size="14" />Compact</button><button type="button" class="button button-dark" :disabled="!input" @click="copy"><Check v-if="copied" :size="14" /><Copy v-else :size="14" />{{ copied ? '已複製' : '複製 JSON' }}</button></div></template>
    </ToolHeader>
    <section class="panel sql-toolbar"><div class="toolbar-actions-left"><label class="select-field"><span>縮排空格</span><select v-model.number="indent"><option :value="2">2 Spaces</option><option :value="4">4 Spaces</option></select></label><button type="button" class="text-button" @click="toggleAll(true)"><ChevronsUpDown :size="14" />全部展開</button><button type="button" class="text-button" @click="toggleAll(false)"><ChevronsDownUp :size="14" />全部收合</button></div><button type="button" class="text-button danger-text" @click="input = ''"><Trash2 :size="14" />清空內容</button></section>
    <div class="editor-grid">
      <section class="panel editor-panel"><div class="editor-heading"><span><Braces :size="15" /> JSON 原始碼</span><small>{{ input.length }} chars</small></div><textarea v-model="input" spellcheck="false" placeholder="在此貼上 JSON..." /></section>
      <section class="panel editor-panel"><div class="editor-heading result-editor-heading"><span><ListTree :size="15" /> 樹狀檢視</span><small>{{ parsed.error ? 'invalid' : 'valid' }}</small></div><div v-if="parsed.error" class="editor-error">JSON 解析錯誤：{{ parsed.error }}</div><div v-else-if="'value' in parsed" class="json-tree"><JsonNode :key="treeKey" :value="parsed.value" :open="openAll" /></div></section>
    </div>
  </div>
</template>
