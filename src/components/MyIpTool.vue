<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Activity, Check, Copy, Cpu, MapPin, RefreshCw, Search, Server, Wifi } from 'lucide-vue-next';
import ToolHeader from './ToolHeader.vue';
import { copyText } from '../utils';

interface IpData {
  ip: string;
  isIpv6: boolean;
  geo: {
    country: string;
    countryCode: string;
    region: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
    isp: string;
    org: string;
    as: string;
  };
  headers: Record<string, string>;
}

const emit = defineEmits<{ notice: [message: string, type?: 'success' | 'info' | 'error'] }>();
const loading = ref(true);
const error = ref('');
const ipData = ref<IpData | null>(null);
const customIp = ref('');
const copied = ref(false);
const pings = ref<Record<string, string>>({
  'Cloudflare · 1.1.1.1': '檢測中...',
  'Google DNS · 8.8.8.8': '檢測中...',
  'Quad9 · 9.9.9.9': '檢測中...',
});

async function fetchIp(target?: string): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    const endpoint = target ? `https://ipapi.co/${encodeURIComponent(target)}/json/` : 'https://ipapi.co/json/';
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('無法擷取 IP 資訊');
    const result = await response.json() as Record<string, unknown>;
    if (result.error) throw new Error(String(result.reason ?? 'IP 查詢失敗'));
    ipData.value = {
      ip: String(result.ip ?? ''),
      isIpv6: String(result.ip ?? '').includes(':'),
      geo: {
        country: String(result.country_name ?? 'Unknown'),
        countryCode: String(result.country_code ?? ''),
        region: String(result.region ?? ''),
        city: String(result.city ?? ''),
        zip: String(result.postal ?? ''),
        lat: Number(result.latitude ?? 0),
        lon: Number(result.longitude ?? 0),
        timezone: String(result.timezone ?? ''),
        isp: String(result.org ?? 'Unknown'),
        org: String(result.org ?? ''),
        as: String(result.asn ?? ''),
      },
      headers: {
        'user-agent': navigator.userAgent,
        'accept-language': navigator.language,
        'x-forwarded-proto': window.location.protocol.replace(':', ''),
      },
    };
  } catch (fetchError) {
    error.value = fetchError instanceof Error ? fetchError.message : '無法連線至 IP 檢測服務';
    emit('notice', error.value, 'error');
  } finally {
    loading.value = false;
  }
}

async function runPings(): Promise<void> {
  const targets = [
    { key: 'Cloudflare · 1.1.1.1', url: 'https://1.1.1.1/cdn-cgi/trace' },
    { key: 'Google DNS · 8.8.8.8', url: 'https://dns.google' },
    { key: 'Quad9 · 9.9.9.9', url: 'https://quad9.net' },
  ];
  const values: Record<string, string> = {};
  await Promise.all(targets.map(async (target) => {
    const started = performance.now();
    try {
      await fetch(target.url, { mode: 'no-cors', cache: 'no-store' });
      values[target.key] = `${Math.round(performance.now() - started)} ms`;
    } catch {
      values[target.key] = '逾時 / 阻擋';
    }
  }));
  pings.value = values;
}

async function refresh(): Promise<void> {
  await Promise.all([fetchIp(), runPings()]);
}
async function lookupCustom(): Promise<void> {
  if (customIp.value.trim()) await fetchIp(customIp.value.trim());
}
async function copyIp(): Promise<void> {
  if (!ipData.value) return;
  try {
    await copyText(ipData.value.ip);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 1500);
    emit('notice', '已複製 IP 位址');
  } catch (copyError) {
    emit('notice', copyError instanceof Error ? copyError.message : '複製失敗', 'error');
  }
}
function flag(countryCode: string): string {
  if (countryCode.length !== 2) return '◎';
  return String.fromCodePoint(...countryCode.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0)));
}
const networkLabel = computed(() => ipData.value?.geo.org || ipData.value?.geo.isp || 'Unknown network');
onMounted(refresh);
</script>

<template>
  <div class="tool-page">
    <ToolHeader title="What Is My IP 工具" description="檢測您當前的公網 IP 位址、地理位置、ISP 電信商與網路延遲。">
      <template #actions><button type="button" class="button button-dark" :disabled="loading" @click="refresh"><RefreshCw :size="15" :class="{ 'spin-slow': loading }" />重新檢測</button></template>
    </ToolHeader>
    <section class="panel ip-search-panel"><form @submit.prevent="lookupCustom"><label class="search-input"><Search :size="15" /><input v-model="customIp" type="text" placeholder="輸入指定 IP 進行查詢，例如 8.8.8.8" /></label><button type="submit" class="button button-light"><Search :size="14" />查詢指定 IP</button></form></section>
    <div v-if="error" class="error-box">{{ error }}</div>
    <div v-if="loading" class="panel loading-state"><span class="loader" />正在檢測您的 IP 位址與網路路由...</div>
    <template v-else-if="ipData">
      <section class="ip-hero"><div><div class="hero-labels"><span>YOUR PUBLIC IP</span><b>{{ ipData.isIpv6 ? 'IPv6' : 'IPv4' }}</b></div><div class="ip-value"><strong>{{ ipData.ip }}</strong><button type="button" class="hero-copy" @click="copyIp"><Check v-if="copied" :size="19" /><Copy v-else :size="19" /></button></div><div class="hero-subline"><span>{{ flag(ipData.geo.countryCode) }} {{ ipData.geo.country }} ({{ ipData.geo.countryCode || '??' }})</span><i /> <span>{{ ipData.geo.city || ipData.geo.region || '城市未知' }}</span><i /> <span>{{ ipData.geo.isp }}</span></div></div><div class="hero-network"><small>網路與時區</small><strong>{{ networkLabel }}</strong><span>{{ ipData.geo.timezone || '時區未知' }}</span></div></section>
      <div class="ip-detail-grid"><section class="panel detail-card"><h2><MapPin :size="16" />地理位置</h2><div class="key-value-list"><div><span>國家 / 地區</span><b>{{ flag(ipData.geo.countryCode) }} {{ ipData.geo.country }}</b></div><div><span>省份 / 州</span><b>{{ ipData.geo.region || '-' }}</b></div><div><span>城市</span><b>{{ ipData.geo.city || '-' }}</b></div><div><span>郵遞區號</span><b>{{ ipData.geo.zip || '-' }}</b></div><div><span>經緯度</span><b>{{ ipData.geo.lat }}, {{ ipData.geo.lon }}</b></div></div></section><section class="panel detail-card"><h2><Server :size="16" />網路與電信商</h2><div class="key-value-list"><div><span>網路服務商</span><b>{{ ipData.geo.isp }}</b></div><div><span>組織</span><b>{{ ipData.geo.org || ipData.geo.isp }}</b></div><div><span>自治系統</span><b>{{ ipData.geo.as || '-' }}</b></div><div><span>時區</span><b>{{ ipData.geo.timezone || '-' }}</b></div></div></section><section class="panel detail-card"><h2><Activity :size="16" />網路回應延遲</h2><div class="key-value-list"><div v-for="(time, server) in pings" :key="server"><span>{{ server }}</span><b class="accent-text">{{ time }}</b></div></div></section></div>
      <section class="panel headers-card"><h2><Cpu :size="16" />HTTP 請求標頭</h2><div class="headers-code"><div><span>User-Agent</span><code>{{ ipData.headers['user-agent'] }}</code></div><div><span>Accept-Language</span><code>{{ ipData.headers['accept-language'] }}</code></div><div><span>Protocol</span><code>{{ ipData.headers['x-forwarded-proto'] }}</code></div></div></section>
    </template>
  </div>
</template>
