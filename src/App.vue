<script setup lang="ts">
import { computed, ref, type Component } from 'vue';
import {
  ArrowRight,
  Clock3,
  Database,
  FileCode2,
  Globe2,
  Grid2X2,
  Hash,
  KeyRound,
  List as ListIcon,
  Search,
  ShieldCheck,
  Star,
  Wifi,
  X,
  Zap,
  RefreshCw,
  Check,
  Info,
  CircleAlert,
} from 'lucide-vue-next';
import type { CategoryId, ToastMessage, ToastType, ToolId } from './types';
import { categories, tools } from './data/tools';
import { readStorage, writeStorage } from './utils';
import UuidGenerator from './components/UuidGenerator.vue';
import ListTool from './components/ListTool.vue';
import DateTimeConverter from './components/DateTimeConverter.vue';
import Base64Tool from './components/Base64Tool.vue';
import JwtTool from './components/JwtTool.vue';
import SqlFormatter from './components/SqlFormatter.vue';
import WhoisLookup from './components/WhoisLookup.vue';
import MyIpTool from './components/MyIpTool.vue';

const iconMap: Record<string, Component> = {
  ArrowRight,
  Check,
  CircleAlert,
  Clock3,
  Database,
  FileCode2,
  Globe2,
  Grid2X2,
  Hash,
  Info,
  KeyRound,
  List: ListIcon,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Wifi,
  X,
  Zap,
};

const toolComponents: Record<ToolId, Component> = {
  uuid: UuidGenerator,
  list: ListTool,
  datetime: DateTimeConverter,
  base64: Base64Tool,
  jwt: JwtTool,
  sql: SqlFormatter,
  whois: WhoisLookup,
  myip: MyIpTool,
};

const activeCategory = ref<CategoryId>('all');
const activeTool = ref<ToolId>('uuid');
const searchQuery = ref('');
const favorites = ref<ToolId[]>(readStorage<ToolId[]>('yuzi_favorites', ['uuid', 'jwt', 'myip']));
const toasts = ref<ToastMessage[]>([]);

const categoryTools = computed(() => {
  if (activeCategory.value === 'all') return tools;
  if (activeCategory.value === 'favorites') return tools.filter((tool) => favorites.value.includes(tool.id));
  return tools.filter((tool) => tool.category === activeCategory.value);
});

const matchingTools = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return [];
  return tools.filter((tool) =>
    [tool.name, tool.description, tool.id].some((value) => value.toLowerCase().includes(query)),
  );
});

const activeCategoryMeta = computed(() => categories.find((category) => category.id === activeCategory.value));
const activeComponent = computed(() => toolComponents[activeTool.value]);
const sidebarTools = computed(() => {
  if (activeCategory.value !== 'all') return categoryTools.value;
  const favoriteTools = tools.filter((tool) => favorites.value.includes(tool.id));
  const otherTools = tools.filter((tool) => !favorites.value.includes(tool.id));
  return [...favoriteTools, ...otherTools];
});

function selectCategory(category: CategoryId): void {
  activeCategory.value = category;
  const available = category === 'all'
    ? tools
    : category === 'favorites'
      ? tools.filter((tool) => favorites.value.includes(tool.id))
      : tools.filter((tool) => tool.category === category);
  if (available.length && !available.some((tool) => tool.id === activeTool.value)) {
    activeTool.value = available[0].id;
  }
}

function selectTool(toolId: ToolId): void {
  activeTool.value = toolId;
  const selected = tools.find((tool) => tool.id === toolId);
  if (selected && activeCategory.value !== 'all' && activeCategory.value !== 'favorites') {
    activeCategory.value = selected.category;
  }
}

function toggleFavorite(toolId: ToolId): void {
  favorites.value = favorites.value.includes(toolId)
    ? favorites.value.filter((item) => item !== toolId)
    : [...favorites.value, toolId];
  writeStorage('yuzi_favorites', favorites.value);
}

function showNotice(title: string, type: ToastType = 'success'): void {
  const toast: ToastMessage = { id: Date.now() + Math.random(), title, type };
  toasts.value.push(toast);
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((item) => item.id !== toast.id);
  }, 3200);
}

function dismissToast(id: number): void {
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
}
</script>

<template>
  <div class="app-shell">
    <div class="grain" aria-hidden="true" />

    <div v-if="toasts.length" class="toast-stack" aria-live="polite">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="`toast-${toast.type}`">
        <component :is="iconMap[toast.type === 'error' ? 'CircleAlert' : toast.type === 'info' ? 'Info' : 'Check']" :size="16" />
        <span>{{ toast.title }}</span>
        <button type="button" aria-label="關閉通知" @click="dismissToast(toast.id)">
          <X :size="14" />
        </button>
      </div>
    </div>

    <header class="topbar">
      <div class="topbar-inner">
        <nav class="category-nav" aria-label="工具分類">
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            class="category-pill"
            :class="{ active: activeCategory === category.id }"
            @click="selectCategory(category.id)"
          >
            <component :is="iconMap[category.icon]" :size="14" />
            <span>{{ category.label }}</span>
            <b v-if="category.id === 'favorites' && favorites.length" class="count-badge">{{ favorites.length }}</b>
          </button>
        </nav>

        <label class="global-search desktop-search">
          <Search :size="15" />
          <input v-model="searchQuery" type="search" placeholder="搜尋工具..." aria-label="搜尋工具" />
          <kbd>/</kbd>
        </label>
      </div>
      <label class="global-search mobile-search">
        <Search :size="15" />
        <input v-model="searchQuery" type="search" placeholder="搜尋工具..." aria-label="搜尋工具" />
      </label>
    </header>

    <main class="page-container">
      <div v-if="searchQuery.trim()" class="search-view">
        <div class="section-heading">
          <div>
            <span class="eyebrow">Command / search</span>
            <h2>搜尋結果 <em>{{ matchingTools.length }}</em></h2>
          </div>
          <button type="button" class="text-button" @click="searchQuery = ''">清除搜尋 <X :size="14" /></button>
        </div>
        <div v-if="matchingTools.length" class="search-grid">
          <button
            v-for="tool in matchingTools"
            :key="tool.id"
            type="button"
            class="search-result-card"
            @click="selectTool(tool.id); searchQuery = ''"
          >
            <span class="result-icon"><component :is="iconMap[tool.icon]" :size="17" /></span>
            <span class="result-copy">
              <strong>{{ tool.name }}</strong>
              <small>{{ tool.description }}</small>
            </span>
            <ArrowRight :size="17" class="result-arrow" />
          </button>
        </div>
        <div v-else class="empty-state">沒有找到與「{{ searchQuery }}」相關的工具。</div>
      </div>

      <div v-else class="workspace-layout">
        <aside class="sidebar">
          <div class="sidebar-label">
            <span>{{ activeCategoryMeta?.label ?? '工具選單' }}</span>
            <b>{{ sidebarTools.length.toString().padStart(2, '0') }}</b>
          </div>
          <div v-if="sidebarTools.length" class="tool-list">
            <div
              v-for="tool in sidebarTools"
              :key="tool.id"
              class="tool-nav-item"
              :class="{ active: activeTool === tool.id }"
            >
              <button type="button" class="tool-nav-main" @click="selectTool(tool.id)">
                <span class="tool-nav-icon"><component :is="iconMap[tool.icon]" :size="16" /></span>
                <span>{{ tool.name }}</span>
              </button>
              <button
                type="button"
                class="favorite-button"
                :class="{ favorite: favorites.includes(tool.id) }"
                :aria-label="favorites.includes(tool.id) ? '取消最愛' : '加入最愛'"
                @click.stop="toggleFavorite(tool.id)"
              >
                <Star :size="14" :fill="favorites.includes(tool.id) ? 'currentColor' : 'none'" />
              </button>
            </div>
          </div>
          <div v-else class="sidebar-empty">
            <Star :size="20" />
            <span>此分類下尚無工具。</span>
          </div>

        </aside>

        <section class="tool-stage">
          <component :is="activeComponent" @notice="showNotice" />
        </section>
      </div>
    </main>

    <footer class="site-footer">
      <div>
        <strong>Yuzi Toolkit</strong>
        <span>安靜、快速、沒有多餘追蹤的開發者工具。</span>
      </div>
      <span class="footer-meta">Vue 3 · Vite · client-side first</span>
    </footer>
  </div>
</template>
