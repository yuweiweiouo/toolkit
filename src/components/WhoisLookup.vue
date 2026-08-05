<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { AlertCircle, ChevronDown, ChevronUp, Globe2, History, Search, Server, ShieldCheck } from 'lucide-vue-next';
import ToolHeader from './ToolHeader.vue';
import { readStorage, writeStorage } from '../utils';

interface WhoisData {
  query: string;
  type: string;
  handle?: string;
  ldhName?: string;
  registrar?: string;
  createdDate?: string | null;
  expiresDate?: string | null;
  nameServers?: string[];
  status?: string[];
  rawRdap?: unknown;
}

const emit = defineEmits<{ notice: [message: string, type?: 'success' | 'info' | 'error'] }>();
const query = ref('github.com');
const loading = ref(false);
const data = ref<WhoisData | null>(null);
const error = ref('');
const showRaw = ref(false);
const history = ref(readStorage<string[]>('wabi_whois_history', ['github.com', 'google.com', '1.1.1.1']));

function cleanQuery(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split('?')[0];
}

async function lookup(target = query.value): Promise<void> {
  const clean = cleanQuery(target);
  if (!clean) return;
  query.value = clean;
  loading.value = true;
  error.value = '';
  data.value = null;
  try {
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(clean) || clean.includes(':');
    const response = await fetch(`https://rdap.org/${isIp ? 'ip' : 'domain'}/${encodeURIComponent(clean)}`, { headers: { Accept: 'application/rdap+json, application/json' } });
    if (!response.ok) throw new Error(response.status === 404 ? `找不到「${clean}」的 RDAP 記錄` : `RDAP 伺服器回傳 HTTP ${response.status}`);
    const raw = await response.json() as Record<string, unknown>;
    const events = Array.isArray(raw.events) ? raw.events as Array<{ eventAction?: string; eventDate?: string }> : [];
    const registrarEntity = Array.isArray(raw.entities) ? (raw.entities as Array<Record<string, unknown>>).find((entity) => Array.isArray(entity.roles) && entity.roles.includes('registrar')) : undefined;
    const vcard = registrarEntity?.vcardArray as unknown[] | undefined;
    const vcardEntries = Array.isArray(vcard?.[1]) ? vcard[1] as unknown[][] : [];
    const registrarCard = vcardEntries.find((entry) => entry[0] === 'fn');
    const nameServers = Array.isArray(raw.nameservers) ? (raw.nameservers as Array<Record<string, string>>).map((server) => server.ldhName || server.unicodeName || server.handle).filter(Boolean) : [];
    data.value = {
      query: clean,
      type: isIp ? 'IP' : 'Domain',
      handle: String(raw.handle ?? ''),
      ldhName: String(raw.ldhName ?? clean),
      registrar: String(registrarCard?.[3] ?? registrarEntity?.handle ?? 'Unknown'),
      createdDate: events.find((event) => event.eventAction === 'registration')?.eventDate ?? null,
      expiresDate: events.find((event) => event.eventAction === 'expiration')?.eventDate ?? null,
      nameServers,
      status: Array.isArray(raw.status) ? raw.status as string[] : [],
      rawRdap: raw,
    };
    history.value = [clean, ...history.value.filter((item) => item !== clean)].slice(0, 8);
    writeStorage('wabi_whois_history', history.value);
  } catch (lookupError) {
    error.value = lookupError instanceof Error ? lookupError.message : '無法連線至 WHOIS / RDAP 伺服器';
    emit('notice', error.value, 'error');
  } finally {
    loading.value = false;
  }
}

onMounted(() => lookup());
const expirationDays = computed(() => {
  if (!data.value?.expiresDate) return null;
  return Math.ceil((new Date(data.value.expiresDate).getTime() - Date.now()) / 86400000);
});
function formatDate(date?: string | null): string {
  return date ? new Date(date).toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short' }) : '無資料';
}
</script>

<template>
  <div class="tool-page">
    <ToolHeader title="WHOIS DNS" description="查詢網域名稱與 IP 位址的註冊商、到期日、DNS 伺服器與權威 RDAP 記錄。" />
    <section class="panel lookup-panel"><form class="lookup-form" @submit.prevent="lookup()"><label class="search-input"><Globe2 :size="17" /><input v-model="query" type="text" placeholder="輸入網域名稱或 IP 位址" /></label><button type="submit" class="button button-accent" :disabled="loading"><Search :size="15" />{{ loading ? '查詢中...' : '進行 WHOIS 查詢' }}</button></form><div class="history-row"><span><History :size="13" />近期查詢</span><button v-for="item in history" :key="item" type="button" class="history-chip" @click="lookup(item)">{{ item }}</button></div></section>
    <div v-if="error" class="error-box"><AlertCircle :size="16" />{{ error }}</div>
    <div v-if="loading" class="panel loading-state"><span class="loader" />正在連線 RDAP 伺服器並整理資料...</div>
    <template v-else-if="data">
      <div class="whois-summary-grid"><div class="summary-card"><span>查詢對象 · {{ data.type }}</span><strong>{{ data.ldhName || data.query }}</strong><small>Handle: {{ data.handle || 'N/A' }}</small></div><div class="summary-card"><span>註冊商 · Registrar</span><strong>{{ data.registrar }}</strong></div><div class="summary-card"><span>註冊時間 · Created</span><strong>{{ formatDate(data.createdDate) }}</strong></div><div class="summary-card"><span>到期時間 · Expires</span><strong>{{ formatDate(data.expiresDate) }}</strong><b v-if="expirationDays !== null" class="status-badge" :class="{ warning: expirationDays < 30 }">{{ expirationDays > 0 ? `剩餘 ${expirationDays} 天` : '已到期' }}</b></div></div>
      <div class="two-card-grid"><section class="panel detail-card"><h2><Server :size="16" />DNS 名稱伺服器</h2><div v-if="data.nameServers?.length" class="tag-list"><code v-for="server in data.nameServers" :key="server">{{ server }}</code></div><p v-else class="muted">無公佈 Name Server 資料</p></section><section class="panel detail-card"><h2><ShieldCheck :size="16" />網域狀態標籤</h2><div v-if="data.status?.length" class="tag-list"><code v-for="status in data.status" :key="status">{{ status }}</code></div><p v-else class="muted">無 Domain Status 資料</p></section></div>
      <section class="panel raw-panel"><button type="button" class="raw-toggle" @click="showRaw = !showRaw"><span>原始 RDAP JSON 資料</span><ChevronUp v-if="showRaw" :size="16" /><ChevronDown v-else :size="16" /></button><pre v-if="showRaw">{{ JSON.stringify(data.rawRdap, null, 2) }}</pre></section>
    </template>
  </div>
</template>
