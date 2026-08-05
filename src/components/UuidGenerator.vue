<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Check, Copy, Download, Filter, Hash, RefreshCw } from 'lucide-vue-next';
import { v1 as uuidv1, v4 as uuidv4, v7 as uuidv7 } from 'uuid';
import ToolHeader from './ToolHeader.vue';
import { copyText, downloadText } from '../utils';

type UuidVersion = 'v1' | 'v4' | 'v7';
type Wrapper = 'none' | 'double' | 'single' | 'braces';
type Separator = 'newline' | 'comma' | 'semicolon';

const emit = defineEmits<{ notice: [message: string, type?: 'success' | 'info' | 'error'] }>();
const version = ref<UuidVersion>('v4');
const quantity = ref(12);
const uppercase = ref(false);
const hyphens = ref(true);
const wrapper = ref<Wrapper>('none');
const separator = ref<Separator>('newline');
const filter = ref('');
const uuids = ref<string[]>([]);
const copiedIndex = ref<number | null>(null);
const copiedAll = ref(false);

function generate(): void {
  const count = Math.min(Math.max(Number(quantity.value) || 1, 1), 500);
  quantity.value = count;
  uuids.value = Array.from({ length: count }, () => {
    let value: string;
    if (version.value === 'v1') value = uuidv1();
    else if (version.value === 'v7') value = uuidv7();
    else value = uuidv4();
    if (!hyphens.value) value = value.replaceAll('-', '');
    if (uppercase.value) value = value.toUpperCase();
    if (wrapper.value === 'double') value = `"${value}"`;
    if (wrapper.value === 'single') value = `'${value}'`;
    if (wrapper.value === 'braces') value = `{${value}}`;
    return value;
  });
}

watch([version, quantity, uppercase, hyphens, wrapper], generate, { immediate: true });

const delimiter = computed(() => {
  if (separator.value === 'comma') return wrapper.value === 'none' ? ', ' : ',\n';
  if (separator.value === 'semicolon') return ';\n';
  return '\n';
});
const output = computed(() => uuids.value.join(delimiter.value));
const filtered = computed(() => {
  const query = filter.value.toLowerCase();
  return query ? uuids.value.filter((value) => value.toLowerCase().includes(query)) : uuids.value;
});

async function copy(value: string, index?: number): Promise<void> {
  try {
    await copyText(value);
    if (typeof index === 'number') {
      copiedIndex.value = index;
      window.setTimeout(() => (copiedIndex.value = null), 1500);
      emit('notice', '已複製單個 UUID');
    } else {
      copiedAll.value = true;
      window.setTimeout(() => (copiedAll.value = false), 1800);
      emit('notice', `已複製 ${uuids.value.length} 個 UUID`);
    }
  } catch (error) {
    emit('notice', error instanceof Error ? error.message : '複製失敗', 'error');
  }
}

function download(): void {
  downloadText(`uuids-${version.value}-${uuids.value.length}.txt`, output.value);
  emit('notice', '檔案已開始下載');
}
</script>

<template>
  <div class="tool-page">
    <ToolHeader
      eyebrow="Developer / generate"
      title="UUIDs 批次生成器"
      description="批次產生標準 UUID，支援多種版本與輸出格式選項。"
    >
      <template #actions>
        <button type="button" class="button button-dark" @click="generate">
          <RefreshCw :size="15" />
          重新生成
        </button>
      </template>
    </ToolHeader>

    <section class="panel control-panel">
      <div class="control-grid uuid-controls">
        <div class="field-group">
          <label>UUID 版本</label>
          <div class="segmented three">
            <button v-for="item in (['v4', 'v7', 'v1'] as UuidVersion[])" :key="item" type="button" :class="{ selected: version === item }" @click="version = item">
              {{ item }} <small>{{ item === 'v4' ? '隨機' : item === 'v7' ? '時間' : 'MAC' }}</small>
            </button>
          </div>
        </div>
        <div class="field-group">
          <div class="field-label-row"><label for="uuid-quantity">生成數量</label><span class="mono">{{ quantity }} 個</span></div>
          <div class="quantity-control">
            <input id="uuid-quantity" v-model.number="quantity" type="number" min="1" max="500" />
            <div class="quick-values">
              <button v-for="number in [10, 50, 100, 200]" :key="number" type="button" :class="{ selected: quantity === number }" @click="quantity = number">{{ number }}</button>
            </div>
          </div>
        </div>
        <div class="field-group">
          <label>格式選項</label>
          <label class="check-row"><input v-model="uppercase" type="checkbox" /> 大寫字母</label>
          <label class="check-row"><input v-model="hyphens" type="checkbox" /> 包含連字符 (-)</label>
        </div>
        <div class="field-group">
          <label>包裹與分隔符號</label>
          <div class="select-pair">
            <select v-model="wrapper">
              <option value="none">無引號</option>
              <option value="double">雙引號 "..."</option>
              <option value="single">單引號 '...'</option>
              <option value="braces">大括號 {...}</option>
            </select>
            <select v-model="separator">
              <option value="newline">換行分隔</option>
              <option value="comma">逗號分隔</option>
              <option value="semicolon">分號分隔</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <section class="panel output-panel">
      <div class="panel-toolbar">
         <div class="toolbar-title"><Hash :size="16" /><span>共產出 <b>{{ uuids.length }}</b> 個 UUIDs</span><span v-if="filter" class="muted">符合 {{ filtered.length }} 個</span></div>
         <div class="toolbar-actions">
           <label class="inline-search"><Filter :size="13" /><input v-model="filter" type="search" placeholder="過濾搜尋..." /></label>
          <button type="button" class="button button-light" @click="copy(output)"><Check v-if="copiedAll" :size="14" /><Copy v-else :size="14" />{{ copiedAll ? '已複製全部' : '複製全部' }}</button>
          <button type="button" class="button button-dark" @click="download"><Download :size="14" />下載文件</button>
        </div>
      </div>
      <div class="uuid-list">
        <div v-if="!filtered.length" class="empty-state">沒有符合條件的 UUID。</div>
        <div v-for="(value, index) in filtered" :key="`${value}-${index}`" class="uuid-row">
          <span class="row-number">#{{ String(index + 1).padStart(2, '0') }}</span>
          <code>{{ value }}</code>
          <button type="button" class="icon-button row-copy" title="複製此項" @click="copy(value, index)">
            <Check v-if="copiedIndex === index" :size="15" class="success-icon" /><Copy v-else :size="15" />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
