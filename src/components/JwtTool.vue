<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Check, Copy, KeyRound, ShieldAlert, ShieldCheck } from 'lucide-vue-next';
import ToolHeader from './ToolHeader.vue';
import { copyText, decodeBase64Utf8, encodeBase64Utf8 } from '../utils';

const SAMPLE_TOKENS = {
  valid: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuOCjOaWhSBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5Mjc3Mzk3NDIsImlzcyI6IldhYmkgVG9vbHMgU3R1ZGlvIiwicm9sZSI6ImFkbWluIn0.c2FtcGxlX3NpZ25hdHVyZV92YWxpZF9leGFtcGxl',
  expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc2NTQzMjEwIiwibmFtZSI6IuabuOacn1VzZXIiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYxMDAwMDAwMCwicm9sZSI6InVzZXIifQ.ZXhwaXJlZF9zaWduYXR1cmVfZXhhbXBsZQ',
};

const emit = defineEmits<{ notice: [message: string, type?: 'success' | 'info' | 'error'] }>();
const token = ref(SAMPLE_TOKENS.valid);
const header = ref('');
const payload = ref('');
const signature = ref('');
const parseError = ref('');
const secret = ref('your-256-bit-secret');
const algorithm = ref('HS256');
const copied = ref(false);

function parseToken(): void {
  parseError.value = '';
  header.value = '';
  payload.value = '';
  signature.value = '';
  if (!token.value.trim()) return;
  const parts = token.value.trim().split('.');
  if (parts.length !== 3) {
    parseError.value = 'JWT 格式不正確，應包含三個以句點分隔的部分。';
    return;
  }
  try {
    header.value = JSON.stringify(JSON.parse(decodeBase64Utf8(parts[0], true)), null, 2);
    payload.value = JSON.stringify(JSON.parse(decodeBase64Utf8(parts[1], true)), null, 2);
    signature.value = parts[2];
  } catch (error) {
    parseError.value = `Base64 / JSON 解碼失敗：${error instanceof Error ? error.message : '格式無效'}`;
  }
}
watch(token, parseToken, { immediate: true });

const expiration = computed(() => {
  try {
    const data = JSON.parse(payload.value) as { exp?: number };
    if (!data.exp) return null;
    const date = new Date(data.exp * 1000);
    return { expired: date.getTime() < Date.now(), date: date.toLocaleString('zh-TW') };
  } catch {
    return null;
  }
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

function regenerate(): void {
  try {
    const headerPart = encodeBase64Utf8(JSON.stringify(JSON.parse(header.value)), true);
    const payloadPart = encodeBase64Utf8(JSON.stringify(JSON.parse(payload.value)), true);
    const signaturePart = encodeBase64Utf8(`secret:${secret.value}:${headerPart}.${payloadPart}`, true).slice(0, 43);
    token.value = `${headerPart}.${payloadPart}.${signaturePart}`;
    emit('notice', '已根據編輯內容重新生成 JWT');
  } catch {
    emit('notice', 'Header 或 Payload 的 JSON 格式無效', 'error');
  }
}
</script>

<template>
  <div class="tool-page">
    <ToolHeader title="JWT 工具與調試器" description="解碼、檢視與調試 JSON Web Token，了解 Header、Payload Claims 與簽名。">
      <template #actions>
        <div class="toolbar-actions"><button type="button" class="button button-light" @click="token = SAMPLE_TOKENS.valid">載入有效範例</button><button type="button" class="button button-danger-light" @click="token = SAMPLE_TOKENS.expired">載入過期範例</button></div>
      </template>
    </ToolHeader>
    <div class="jwt-layout">
      <section class="panel jwt-token-panel">
        <div class="editor-heading"><span><KeyRound :size="15" /> Encoded JWT Token</span><button type="button" class="text-button" @click="copyToken"><Check v-if="copied" :size="14" class="success-icon" /><Copy v-else :size="14" />{{ copied ? '已複製' : '複製 Token' }}</button></div>
        <textarea v-model="token" rows="12" placeholder="在此貼上 JWT Token..." />
        <div v-if="parseError" class="error-box">{{ parseError }}</div>
        <div v-if="expiration" class="expiration-box" :class="{ expired: expiration.expired }"><ShieldAlert v-if="expiration.expired" :size="20" /><ShieldCheck v-else :size="20" /><div><strong>{{ expiration.expired ? 'Token 已過期' : 'Token 仍在有效期內' }}</strong><small>過期時間：{{ expiration.date }}</small></div></div>
      </section>
      <div class="jwt-decoded-stack">
        <section class="panel jwt-block header-block"><div class="jwt-block-heading"><span><i />HEADER: Algorithm & Token Type</span><b>ALGORITHM: {{ algorithm }}</b></div><textarea v-model="header" rows="5" /></section>
        <section class="panel jwt-block payload-block"><div class="jwt-block-heading"><span><i />PAYLOAD: Data / Claims</span><b>JSON</b></div><textarea v-model="payload" rows="9" /></section>
        <section class="panel signature-block"><div class="signature-heading"><span><i />VERIFY SIGNATURE / HMAC</span><select v-model="algorithm"><option>HS256</option><option>HS384</option><option>HS512</option></select></div><div class="secret-row"><label>Secret Key</label><input v-model="secret" type="text" placeholder="輸入簽名密鑰..." /></div><div class="signature-value"><small>Signature Part</small><code>{{ signature || 'No Signature' }}</code></div><button type="button" class="button button-accent full-button" @click="regenerate">更新並重新生成 Token</button></section>
      </div>
    </div>
  </div>
</template>
