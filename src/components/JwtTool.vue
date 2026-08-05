<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  AlertTriangle,
  Check,
  Clock3,
  Code2,
  Copy,
  KeyRound,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-vue-next';
import ToolHeader from './ToolHeader.vue';
import { copyText, decodeBase64Utf8, encodeBase64Utf8 } from '../utils';

const SAMPLE_TOKENS = {
  valid: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuOCjOaWhSBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5Mjc3Mzk3NDIsImlzcyI6IldhYmkgVG9vbHMgU3R1ZGlvIiwicm9sZSI6ImFkbWluIn0.c2FtcGxlX3NpZ25hdHVyZV92YWxpZF9leGFtcGxl',
  expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc2NTQzMjEwIiwibmFtZSI6IuabuOacn1VzZXIiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYxMDAwMDAwMCwicm9sZSI6InVzZXIifQ.ZXhwaXJlZF9zaWduYXR1cmVfZXhhbXBsZQ',
};

type ClaimType = 'string' | 'number' | 'boolean' | 'null' | 'json';
type HmacAlgorithm = 'HS256' | 'HS384' | 'HS512';
type ExpirationStatus = 'valid' | 'expired' | 'missing' | 'invalid';

interface ClaimRow {
  id: number;
  key: string;
  type: ClaimType;
  value: string;
}

interface ExpirationInfo {
  status: ExpirationStatus;
  title: string;
  detail: string;
  date: string;
  relative: string;
}

const emit = defineEmits<{ notice: [message: string, type?: 'success' | 'info' | 'error'] }>();
const token = ref(SAMPLE_TOKENS.valid);
const header = ref('');
const signature = ref('');
const parseError = ref('');
const secret = ref('your-256-bit-secret');
const algorithm = ref<HmacAlgorithm>('HS256');
const copied = ref(false);
const copiedPayload = ref(false);
const showPayloadJson = ref(true);
const claimRows = ref<ClaimRow[]>([]);
const now = ref(Date.now());
let nextClaimId = 0;
let clockTimer: number | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function inferClaimType(value: unknown): ClaimType {
  if (value === null) return 'null';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'json';
}

function claimValueToInput(value: unknown, type: ClaimType): string {
  if (type === 'null') return '';
  if (type === 'json') return JSON.stringify(value, null, 2) ?? '';
  return String(value);
}

function hydrateClaims(payload: Record<string, unknown>): void {
  claimRows.value = Object.entries(payload).map(([key, value]) => {
    const type = inferClaimType(value);
    return {
      id: ++nextClaimId,
      key,
      type,
      value: claimValueToInput(value, type),
    };
  });
}

function parseToken(): void {
  parseError.value = '';
  header.value = '';
  signature.value = '';
  claimRows.value = [];
  if (!token.value.trim()) return;

  const parts = token.value.trim().split('.');
  if (parts.length !== 3) {
    parseError.value = 'JWT 格式不正確，應包含三個以句點分隔的部分。';
    return;
  }

  try {
    const parsedHeader: unknown = JSON.parse(decodeBase64Utf8(parts[0], true));
    const parsedPayload: unknown = JSON.parse(decodeBase64Utf8(parts[1], true));
    if (!isRecord(parsedHeader)) throw new Error('Header 必須是 JSON 物件');
    if (!isRecord(parsedPayload)) throw new Error('Payload 必須是 JSON 物件');

    header.value = JSON.stringify(parsedHeader, null, 2);
    hydrateClaims(parsedPayload);
    signature.value = parts[2];
    if (parsedHeader.alg === 'HS256' || parsedHeader.alg === 'HS384' || parsedHeader.alg === 'HS512') {
      algorithm.value = parsedHeader.alg;
    }
  } catch (error) {
    parseError.value = `Base64 / JSON 解碼失敗：${error instanceof Error ? error.message : '格式無效'}`;
  }
}

watch(token, parseToken, { immediate: true });

const claimState = computed(() => {
  const value: Record<string, unknown> = {};
  const errors = new Map<number, string>();
  const keyOwners = new Map<string, number>();

  for (const row of claimRows.value) {
    const key = row.key.trim();
    if (!key) {
      errors.set(row.id, 'Claim 名稱不可為空');
      continue;
    }
    const previousOwner = keyOwners.get(key);
    if (previousOwner !== undefined) {
      errors.set(previousOwner, `Claim 名稱「${key}」重複`);
      errors.set(row.id, `Claim 名稱「${key}」重複`);
      continue;
    }
    keyOwners.set(key, row.id);

    try {
      if (row.type === 'string') value[key] = row.value;
      else if (row.type === 'number') {
        if (!row.value.trim()) throw new Error('請輸入數字');
        const number = Number(row.value);
        if (!Number.isFinite(number)) throw new Error('必須是有效數字');
        value[key] = number;
      } else if (row.type === 'boolean') value[key] = row.value === 'true';
      else if (row.type === 'null') value[key] = null;
      else value[key] = JSON.parse(row.value);
    } catch (error) {
      errors.set(row.id, error instanceof Error ? error.message : 'JSON 格式無效');
    }
  }

  return { value, errors };
});

const payloadPreview = computed(() => JSON.stringify(claimState.value.value, null, 2));
const claimErrors = computed(() => [...claimState.value.errors.values()]);

function rowError(row: ClaimRow): string {
  return claimState.value.errors.get(row.id) ?? '';
}

function addClaim(): void {
  const baseKey = 'new_claim';
  let key = baseKey;
  let suffix = 1;
  while (claimRows.value.some((row) => row.key === key)) key = `${baseKey}_${suffix++}`;
  claimRows.value.push({ id: ++nextClaimId, key, type: 'string', value: '' });
  showPayloadJson.value = false;
}

function removeClaim(id: number): void {
  claimRows.value = claimRows.value.filter((row) => row.id !== id);
}

function changeClaimType(row: ClaimRow, type: ClaimType): void {
  row.type = type;
  if (type === 'boolean') row.value = 'false';
  else if (type === 'null') row.value = '';
  else if (type === 'number') row.value = '0';
  else if (type === 'json') row.value = '{}';
  else row.value = '';
}

function formatDuration(seconds: number): string {
  const value = Math.abs(seconds);
  if (value < 60) return `${value} 秒`;
  if (value < 3600) return `${Math.floor(value / 60)} 分鐘`;
  if (value < 86400) return `${Math.floor(value / 3600)} 小時`;
  return `${Math.floor(value / 86400)} 天`;
}

const expiration = computed<ExpirationInfo>(() => {
  now.value;
  const expRow = claimRows.value.find((row) => row.key.trim() === 'exp');
  if (!expRow) {
    return { status: 'missing', title: '未設定 expiration', detail: '新增 exp Claim 以追蹤 Token 有效期', date: '未設定', relative: '—' };
  }
  const rowErrorMessage = rowError(expRow);
  const expValue = claimState.value.value.exp;
  if (rowErrorMessage || typeof expValue !== 'number') {
    return { status: 'invalid', title: 'expiration 格式錯誤', detail: 'exp 必須使用 Number 型別的 Unix 時間戳記', date: '格式無效', relative: '—' };
  }

  const expirationDate = new Date(expValue * 1000);
  if (Number.isNaN(expirationDate.getTime())) {
    return { status: 'invalid', title: 'expiration 格式錯誤', detail: 'exp 不是有效的 Unix 時間戳記', date: '格式無效', relative: '—' };
  }

  const difference = Math.floor((expirationDate.getTime() - now.value) / 1000);
  const expired = difference < 0;
  return {
    status: expired ? 'expired' : 'valid',
    title: expired ? 'Token 已過期' : 'Token 仍在有效期內',
    detail: expired ? `已過期 ${formatDuration(difference)}` : `還有 ${formatDuration(difference)}`,
    date: expirationDate.toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short' }),
    relative: expired ? 'EXPIRED' : 'ACTIVE',
  };
});

onMounted(() => {
  clockTimer = window.setInterval(() => (now.value = Date.now()), 1000);
});
onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer);
});

async function copyToken(): Promise<void> {
  try {
    await copyText(token.value);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 1500);
    emit('notice', '已複製 JWT Token');
  } catch (error) {
    emit('notice', error instanceof Error ? error.message : '複製失敗', 'error');
  }
}

async function copyPayload(): Promise<void> {
  try {
    await copyText(payloadPreview.value);
    copiedPayload.value = true;
    window.setTimeout(() => (copiedPayload.value = false), 1500);
    emit('notice', '已複製 Payload JSON');
  } catch (error) {
    emit('notice', error instanceof Error ? error.message : '複製失敗', 'error');
  }
}

function regenerate(): void {
  if (claimErrors.value.length) {
    emit('notice', claimErrors.value[0], 'error');
    return;
  }

  try {
    const headerObject: unknown = JSON.parse(header.value);
    if (!isRecord(headerObject)) throw new Error('Header 必須是 JSON 物件');
    headerObject.alg = algorithm.value;
    const headerPart = encodeBase64Utf8(JSON.stringify(headerObject), true);
    const payloadPart = encodeBase64Utf8(JSON.stringify(claimState.value.value), true);
    const signaturePart = encodeBase64Utf8(`secret:${secret.value}:${headerPart}.${payloadPart}`, true).slice(0, 43);
    token.value = `${headerPart}.${payloadPart}.${signaturePart}`;
    emit('notice', '已根據 Claim 編輯內容重新生成 JWT');
  } catch (error) {
    emit('notice', error instanceof Error ? error.message : 'Header JSON 格式無效', 'error');
  }
}
</script>

<template>
  <div class="tool-page">
    <ToolHeader title="JWT 工具與調試器" description="解碼、編輯與重新生成 JSON Web Token，直接管理 Header、Payload Claims 與 expiration。">
      <template #actions>
        <div class="toolbar-actions"><button type="button" class="button button-light" @click="token = SAMPLE_TOKENS.valid">載入有效範例</button><button type="button" class="button button-danger-light" @click="token = SAMPLE_TOKENS.expired">載入過期範例</button></div>
      </template>
    </ToolHeader>

    <div class="jwt-layout">
      <section class="panel jwt-token-panel">
        <div class="editor-heading"><span><KeyRound :size="15" /> Encoded JWT Token</span><button type="button" class="text-button" @click="copyToken"><Check v-if="copied" :size="14" class="success-icon" /><Copy v-else :size="14" />{{ copied ? '已複製' : '複製 Token' }}</button></div>
        <textarea v-model="token" rows="12" placeholder="在此貼上 JWT Token..." />
        <div v-if="parseError" class="error-box">{{ parseError }}</div>
        <div v-else class="jwt-token-status">
          <div class="jwt-status-caption"><span>TOKEN STATUS</span><b>{{ claimRows.length }} CLAIMS · 3 PARTS</b></div>
          <div class="jwt-expiration-card" :class="`status-${expiration.status}`">
            <div class="jwt-expiration-icon">
              <ShieldAlert v-if="expiration.status === 'expired'" :size="19" />
              <ShieldCheck v-else-if="expiration.status === 'valid'" :size="19" />
              <AlertTriangle v-else-if="expiration.status === 'invalid'" :size="19" />
              <Clock3 v-else :size="19" />
            </div>
            <div class="jwt-expiration-copy"><strong>{{ expiration.title }}</strong><span>{{ expiration.detail }}</span></div>
            <div class="jwt-expiration-meta"><span>EXP · {{ expiration.relative }}</span><b>{{ expiration.date }}</b></div>
          </div>
        </div>
      </section>

      <div class="jwt-decoded-stack">
        <section class="panel jwt-block header-block">
          <div class="jwt-block-heading"><span><i />HEADER: Algorithm & Token Type</span><b>ALGORITHM: {{ algorithm }}</b></div>
          <textarea v-model="header" rows="5" />
        </section>

        <section class="panel jwt-block payload-block">
          <div class="jwt-block-heading payload-heading">
            <span><i />PAYLOAD: Claims <b class="claim-count">{{ claimRows.length }} claims</b></span>
            <div class="claim-toolbar"><button type="button" class="claim-tool-button" @click="showPayloadJson = !showPayloadJson"><Code2 :size="13" />{{ showPayloadJson ? '編輯 Claims' : '檢視 JSON' }}</button><button type="button" class="claim-tool-button add-claim-button" @click="addClaim"><Plus :size="13" />新增 Claim</button></div>
          </div>
          <div v-if="showPayloadJson" class="payload-json-view">
            <div class="payload-json-toolbar"><span>目前 Payload 預覽</span><button type="button" class="text-button" @click="copyPayload"><Check v-if="copiedPayload" :size="13" class="success-icon" /><Copy v-else :size="13" />{{ copiedPayload ? '已複製' : '複製 JSON' }}</button></div>
            <pre>{{ payloadPreview }}</pre>
          </div>
          <div v-else class="claims-editor">
            <div v-if="!claimRows.length" class="claims-empty"><Code2 :size="20" /><span>尚未解析到 Claim，點擊「新增 Claim」開始編輯。</span></div>
            <div v-for="row in claimRows" :key="row.id" class="claim-row" :class="{ invalid: rowError(row) }">
              <div class="claim-row-main">
                <input v-model="row.key" class="claim-key-input" type="text" placeholder="Claim 名稱" aria-label="Claim 名稱" />
                <select :value="row.type" class="claim-type-select" aria-label="Claim 型別" @change="changeClaimType(row, ($event.target as HTMLSelectElement).value as ClaimType)"><option value="string">String</option><option value="number">Number</option><option value="boolean">Boolean</option><option value="null">Null</option><option value="json">JSON</option></select>
                <select v-if="row.type === 'boolean'" v-model="row.value" class="claim-value-input" aria-label="Boolean 值"><option value="true">true</option><option value="false">false</option></select>
                <span v-else-if="row.type === 'null'" class="claim-null-value">null</span>
                <textarea v-else-if="row.type === 'json'" v-model="row.value" class="claim-value-input claim-json-input" rows="2" placeholder='{"role":"admin"}' aria-label="JSON Claim 值" />
                <input v-else v-model="row.value" class="claim-value-input" :type="row.type === 'number' ? 'number' : 'text'" :placeholder="row.type === 'number' ? '輸入數字' : '輸入值'" aria-label="Claim 值" />
                <button type="button" class="icon-button claim-delete-button" title="刪除 Claim" aria-label="刪除 Claim" @click="removeClaim(row.id)"><Trash2 :size="15" /></button>
              </div>
              <small v-if="rowError(row)" class="claim-row-error"><AlertTriangle :size="12" />{{ rowError(row) }}</small>
            </div>
          </div>
        </section>

        <section class="panel signature-block">
          <div class="signature-heading"><span><i />GENERATE SIGNATURE / HMAC</span><select v-model="algorithm"><option value="HS256">HMAC SHA-256 (HS256)</option><option value="HS384">HMAC SHA-384 (HS384)</option><option value="HS512">HMAC SHA-512 (HS512)</option></select></div>
          <div class="secret-row"><label>Secret Key</label><input v-model="secret" type="text" placeholder="輸入簽名密鑰..." /></div>
          <div class="signature-value"><small>Current Signature Part</small><code>{{ signature || 'No Signature' }}</code></div>
          <button type="button" class="button button-accent full-button" :disabled="!!claimErrors.length" @click="regenerate">更新並重新生成 Token</button>
        </section>
      </div>
    </div>
  </div>
</template>
