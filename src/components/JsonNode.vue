<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ name?: string; value: unknown; open: boolean }>();
const isObject = computed(() => typeof props.value === 'object' && props.value !== null);
const entries = computed(() => (isObject.value ? Object.entries(props.value as object) : []));
const summary = computed(() => (Array.isArray(props.value) ? `[ ${entries.value.length} ]` : `{ ${entries.value.length} }`));
const leafType = computed(() => (props.value === null ? 'null' : typeof props.value));
</script>

<template>
  <!-- ponytail: 原生 <details> 負責展開/收合，不自己管狀態 -->
  <details v-if="isObject" :open="open" class="json-node">
    <summary><span v-if="name !== undefined" class="json-key">{{ name }}</span><span class="json-summary">{{ summary }}</span></summary>
    <JsonNode v-for="[key, child] in entries" :key="key" :name="key" :value="child" :open="open" />
  </details>
  <div v-else class="json-leaf"><span v-if="name !== undefined" class="json-key">{{ name }}</span><span :class="`json-${leafType}`">{{ JSON.stringify(value) }}</span></div>
</template>
