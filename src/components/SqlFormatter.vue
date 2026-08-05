<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Check, Code2, Copy, Minimize2, Sparkles, Trash2 } from 'lucide-vue-next';
import { format } from 'sql-formatter';
import ToolHeader from './ToolHeader.vue';
import { copyText } from '../utils';

const SAMPLE_SQL = "SELECT u.id, u.username, u.email, p.title, p.created_at FROM users u LEFT JOIN posts p ON u.id = p.user_id WHERE u.status = 'active' AND p.published_at IS NOT NULL ORDER BY p.created_at DESC LIMIT 50;";
const emit = defineEmits<{ notice: [message: string, type?: 'success' | 'info' | 'error'] }>();
const input = ref(SAMPLE_SQL);
const formatted = ref('');
const dialect = ref('sql');
const indent = ref(2);
const uppercase = ref(true);
const error = ref('');
const copied = ref(false);

function formatSql(): void {
  error.value = '';
  if (!input.value.trim()) {
    formatted.value = '';
    return;
  }
  try {
    formatted.value = format(input.value, { language: dialect.value as never, tabWidth: indent.value, keywordCase: uppercase.value ? 'upper' : 'preserve' });
  } catch (formatError) {
    formatted.value = '';
    error.value = `SQL 格式化解析錯誤：${formatError instanceof Error ? formatError.message : '語法無效'}`;
  }
}
watch([input, dialect, indent, uppercase], formatSql);
onMounted(formatSql);

function minify(): void {
  if (!input.value.trim()) return;
  formatted.value = input.value.replace(/\s+/g, ' ').replace(/\s*([,()=<>])\s*/g, '$1').trim();
  emit('notice', 'SQL 已壓縮成單行');
}

async function copy(): Promise<void> {
  if (!formatted.value) return;
  try {
    await copyText(formatted.value);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 1500);
    emit('notice', '已複製格式化 SQL');
  } catch (copyError) {
    emit('notice', copyError instanceof Error ? copyError.message : '複製失敗', 'error');
  }
}
</script>

<template>
  <div class="tool-page">
    <ToolHeader title="SQL 格式化工具" description="將雜亂的 SQL 語法排版美化，支援多種資料庫方言與關鍵字轉換。">
      <template #actions><div class="toolbar-actions"><button type="button" class="button button-light" @click="minify"><Minimize2 :size="14" />壓縮單列</button><button type="button" class="button button-dark" :disabled="!formatted" @click="copy"><Check v-if="copied" :size="14" /><Copy v-else :size="14" />{{ copied ? '已複製' : '複製 SQL' }}</button></div></template>
    </ToolHeader>
    <section class="panel sql-toolbar"><div class="toolbar-actions-left"><label class="select-field"><span>資料庫方言</span><select v-model="dialect"><option value="sql">Standard SQL</option><option value="mysql">MySQL</option><option value="postgresql">PostgreSQL</option><option value="sqlite">SQLite</option><option value="mariadb">MariaDB</option><option value="tsql">T-SQL</option><option value="plsql">PL/SQL</option></select></label><label class="select-field"><span>縮排空格</span><select v-model.number="indent"><option :value="2">2 Spaces</option><option :value="4">4 Spaces</option></select></label><label class="check-row"><input v-model="uppercase" type="checkbox" /> 關鍵字大寫</label></div><button type="button" class="text-button danger-text" @click="input = ''"><Trash2 :size="14" />清空內容</button></section>
    <div class="editor-grid sql-editor-grid"><section class="panel editor-panel"><div class="editor-heading"><span><Code2 :size="15" /> 原始 SQL 語法</span><small>{{ input.length }} chars</small></div><textarea v-model="input" placeholder="在此輸入或貼上 SQL 查詢語法..." /></section><section class="panel editor-panel"><div class="editor-heading result-editor-heading"><span><Sparkles :size="15" /> 美化後 SQL</span><small>{{ dialect }}</small></div><div v-if="error" class="editor-error">{{ error }}</div><textarea v-else v-model="formatted" readonly placeholder="美化後的 SQL 成果將顯示於此..." /></section></div>
  </div>
</template>
