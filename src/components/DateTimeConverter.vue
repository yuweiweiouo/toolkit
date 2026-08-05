<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Check, Clock3, Copy, Globe2 } from 'lucide-vue-next';
import ToolHeader from './ToolHeader.vue';
import { copyText } from '../utils';

type TimeUnit = 'seconds' | 'milliseconds' | 'nanoseconds';
interface ParsedTimestamp {
  date: Date;
  nanoseconds: bigint;
}

interface TimezoneOption {
  value: string;
  name: string;
}

const timezoneOptions: TimezoneOption[] = [
  { value: 'Asia/Taipei', name: '台灣標準時間' },
  { value: 'Asia/Seoul', name: '韓國標準時間' },
  { value: 'Asia/Tokyo', name: '日本標準時間' },
  { value: 'Asia/Shanghai', name: '中國標準時間' },
  { value: 'Asia/Hong_Kong', name: '香港時間' },
  { value: 'Asia/Singapore', name: '新加坡時間' },
  { value: 'America/New_York', name: '美國東部時間' },
  { value: 'America/Chicago', name: '美國中部時間' },
  { value: 'America/Denver', name: '美國山區時間' },
  { value: 'America/Los_Angeles', name: '美國太平洋時間' },
  { value: 'Europe/London', name: '英國時間' },
  { value: 'UTC', name: '協調世界時間' },
];

const emit = defineEmits<{ notice: [message: string, type?: 'success' | 'info' | 'error'] }>();
const unit = ref<TimeUnit>('seconds');
const live = ref(true);
const timestamp = ref(String(Math.floor(Date.now() / 1000)));
const timezone = ref('Asia/Taipei');
const copied = ref('');
let timer: number | undefined;

function nowValue(): string {
  const milliseconds = Date.now();
  if (unit.value === 'seconds') return String(Math.floor(milliseconds / 1000));
  if (unit.value === 'nanoseconds') return (BigInt(milliseconds) * 1_000_000n).toString();
  return String(milliseconds);
}

function syncNow(): void {
  if (live.value) timestamp.value = nowValue();
}

function setLive(value: boolean): void {
  live.value = value;
  if (value) syncNow();
}

onMounted(() => {
  timer = window.setInterval(syncNow, 1000);
});
onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});

function parseTimestamp(value: string, selectedUnit: TimeUnit): ParsedTimestamp | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    if (selectedUnit === 'nanoseconds') {
      if (!/^[+-]?\d+$/.test(trimmed)) return null;
      const nanoseconds = BigInt(trimmed);
      const milliseconds = nanoseconds / 1_000_000n;
      const date = new Date(Number(milliseconds));
      return Number.isNaN(date.getTime()) ? null : { date, nanoseconds };
    }

    if (!/^[+-]?\d+(\.\d+)?$/.test(trimmed)) return null;
    const number = Number(trimmed);
    const milliseconds = selectedUnit === 'seconds' ? number * 1000 : number;
    const date = new Date(milliseconds);
    if (Number.isNaN(date.getTime())) return null;
    return { date, nanoseconds: BigInt(Math.trunc(date.getTime())) * 1_000_000n };
  } catch {
    return null;
  }
}

function formatDateAsTimestamp(date: Date, selectedUnit: TimeUnit): string {
  const milliseconds = date.getTime();
  if (selectedUnit === 'seconds') return String(Math.floor(milliseconds / 1000));
  if (selectedUnit === 'nanoseconds') return (BigInt(milliseconds) * 1_000_000n).toString();
  return String(milliseconds);
}

function setUnit(nextUnit: TimeUnit): void {
  const parsed = parseTimestamp(timestamp.value, unit.value);
  unit.value = nextUnit;
  timestamp.value = live.value ? nowValue() : parsed ? formatDateAsTimestamp(parsed.date, nextUnit) : timestamp.value;
}

function formatTimezoneOffset(date: Date | null, timeZone: string): string {
  const referenceDate = date ?? new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    timeZoneName: 'longOffset',
  }).formatToParts(referenceDate);
  const offset = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  if (offset === 'GMT' || offset === 'UTC') return 'UTC+0';

  const match = offset.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return offset.replace('GMT', 'UTC');

  const [, sign, hours, minutes] = match;
  return `UTC${sign}${hours}${minutes && minutes !== '00' ? `:${minutes}` : ''}`;
}

const parsedTimestamp = computed(() => parseTimestamp(timestamp.value, unit.value));
const currentDate = computed(() => parsedTimestamp.value?.date ?? null);
const isValid = computed(() => currentDate.value !== null);
const seconds = computed(() => currentDate.value ? String(Math.floor(currentDate.value.getTime() / 1000)) : '-');
const milliseconds = computed(() => currentDate.value ? String(currentDate.value.getTime()) : '-');
const nanoseconds = computed(() => parsedTimestamp.value?.nanoseconds.toString() ?? '-');
const iso = computed(() => currentDate.value?.toISOString() ?? '-');
const utc = computed(() => currentDate.value?.toUTCString() ?? '-');
const selectedTimezone = computed(() => timezoneOptions.find((option) => option.value === timezone.value));
const selectedTimezoneOffset = computed(() => formatTimezoneOffset(currentDate.value, timezone.value));
const timezoneChoices = computed(() => timezoneOptions.map((option) => ({
  ...option,
  offset: formatTimezoneOffset(currentDate.value, option.value),
})));
const localTime = computed(() => currentDate.value
  ? new Intl.DateTimeFormat('zh-TW', { timeZone: timezone.value, dateStyle: 'medium', timeStyle: 'medium', hour12: false }).format(currentDate.value)
  : '-');

const japaneseEra = computed(() => {
  const date = currentDate.value;
  if (!date) return '-';
  const year = date.getFullYear();
  const day = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
  if (year >= 2019) return `令和 ${year === 2019 ? '元年' : `${year - 2018}年`} ${date.getMonth() + 1}月${date.getDate()}日 (${day})`;
  if (year >= 1989) return `平成 ${year - 1988}年 ${date.getMonth() + 1}月${date.getDate()}日 (${day})`;
  return `${year}年 ${date.getMonth() + 1}月${date.getDate()}日 (${day})`;
});

const relative = computed(() => {
  if (!currentDate.value) return '-';
  const diff = Math.floor((currentDate.value.getTime() - Date.now()) / 1000);
  const absolute = Math.abs(diff);
  if (absolute < 60) return `${absolute} 秒${diff >= 0 ? '後' : '前'}`;
  if (absolute < 3600) return `${Math.floor(absolute / 60)} 分${diff >= 0 ? '後' : '前'}`;
  if (absolute < 86400) return `${Math.floor(absolute / 3600)} 小時${diff >= 0 ? '後' : '前'}`;
  return `${Math.floor(absolute / 86400)} 天${diff >= 0 ? '後' : '前'}`;
});

function applyPreset(type: 'now' | 'todayStart' | 'todayEnd' | 'monthStart' | 'hourAgo' | 'dayLater'): void {
  const date = new Date();
  if (type === 'todayStart') date.setHours(0, 0, 0, 0);
  if (type === 'todayEnd') date.setHours(23, 59, 59, 999);
  if (type === 'monthStart') date.setDate(1), date.setHours(0, 0, 0, 0);
  if (type === 'hourAgo') date.setTime(date.getTime() - 3600 * 1000);
  if (type === 'dayLater') date.setTime(date.getTime() + 86400 * 1000);
  setLive(type === 'now');
  timestamp.value = formatDateAsTimestamp(date, unit.value);
}

function handleDate(value: string): void {
  if (!value) return;
  setLive(false);
  const date = new Date(value);
  timestamp.value = formatDateAsTimestamp(date, unit.value);
}

async function copyValue(key: string, value: string): Promise<void> {
  try {
    await copyText(value);
    copied.value = key;
    window.setTimeout(() => (copied.value = ''), 1500);
    emit('notice', `已複製：${value}`);
  } catch (error) {
    emit('notice', error instanceof Error ? error.message : '複製失敗', 'error');
  }
}

const results = computed(() => [
  { key: 'seconds', label: 'Unix 時間戳記 (秒)', value: seconds.value, wide: false },
  { key: 'milliseconds', label: 'Unix 時間戳記 (毫秒)', value: milliseconds.value, wide: false },
  { key: 'nanoseconds', label: 'Unix 時間戳記 (奈秒 / ns)', value: nanoseconds.value, wide: false },
  { key: 'local', label: `所選時區時間 (${selectedTimezone.value?.name ?? timezone.value} · ${selectedTimezoneOffset.value})`, value: localTime.value, wide: true },
  { key: 'era', label: '日本和曆表記', value: japaneseEra.value, wide: false },
  { key: 'relative', label: '相對時間', value: relative.value, wide: false },
  { key: 'iso', label: 'ISO 8601 String', value: iso.value, wide: false },
  { key: 'utc', label: 'UTC String', value: utc.value, wide: false },
]);
</script>

<template>
  <div class="tool-page">
  <ToolHeader title="日期時間轉換器" description="Unix 秒、毫秒、奈秒時間戳記與 ISO 8601、和曆、多時區雙向精確轉換。">
      <template #actions>
        <button type="button" class="button" :class="live ? 'button-dark' : 'button-light'" @click="setLive(!live)">
          <Clock3 :size="15" :class="{ 'spin-slow': live }" />{{ live ? '實時更新中' : '暫停實時' }}
        </button>
      </template>
    </ToolHeader>

    <section class="panel input-panel">
      <div class="two-column-fields">
        <div class="field-group">
          <div class="field-label-row"><label for="timestamp">Unix 時間戳記</label></div>
          <div class="timestamp-input-group">
            <input id="timestamp" v-model="timestamp" class="timestamp-value-input mono-input" type="text" placeholder="輸入時間戳記..." @input="live = false" />
            <select :value="unit" class="unit-select" aria-label="Unix 時間戳記單位" @change="setUnit(($event.target as HTMLSelectElement).value as TimeUnit)">
              <option value="seconds">seconds · 秒</option>
              <option value="milliseconds">milliseconds · 毫秒</option>
              <option value="nanoseconds">nanoseconds · 奈秒</option>
            </select>
          </div>
        </div>
        <div class="field-group">
          <label for="date-picker">或直接選擇日期時間</label>
          <input id="date-picker" class="text-input" type="datetime-local" @change="handleDate(($event.target as HTMLInputElement).value)" />
        </div>
      </div>
      <div class="preset-row">
        <span>快速設值</span>
        <button v-for="preset in [['now', '現在'], ['todayStart', '本日起始'], ['todayEnd', '本日結束'], ['monthStart', '今月 1 日'], ['hourAgo', '1 小時前'], ['dayLater', '1 天後']] as const" :key="preset[0]" type="button" class="chip-button" @click="applyPreset(preset[0])">{{ preset[1] }}</button>
      </div>
    </section>

    <section class="panel result-panel">
      <div class="result-heading">
        <h2><Globe2 :size="17" />轉換結果與時區設定</h2>
        <label class="timezone-select"><span>時區</span><select v-model="timezone"><option v-for="option in timezoneChoices" :key="option.value" :value="option.value">{{ option.name }} · {{ option.offset }}</option></select></label>
      </div>
      <div v-if="!isValid" class="error-box">請輸入有效的數字時間戳記。</div>
      <div v-else class="result-grid">
        <div v-for="result in results" :key="result.key" class="result-card" :class="{ wide: result.wide }">
          <div class="result-card-label"><span>{{ result.label }}</span><button type="button" class="icon-button" @click="copyValue(result.key, result.value)"><Check v-if="copied === result.key" :size="14" class="success-icon" /><Copy v-else :size="14" /></button></div>
          <strong :class="{ 'mono-text': result.key !== 'era' && result.key !== 'relative' }">{{ result.value }}</strong>
        </div>
      </div>
    </section>
  </div>
</template>
