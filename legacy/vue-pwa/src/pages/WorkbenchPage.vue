<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Camera, Search, Scroll, Package, GripHorizontal, Flame, Trash2, HelpCircle, Sun, Moon, History, BookOpen, Stamp } from 'lucide-vue-next';
import { useItems } from '../lib/useItems';
import { db, type Item } from '../lib/db';
import ItemCard from '../components/ItemCard.vue';

const router = useRouter();
const { useLiveQuery } = useItems();

// TABS
type TabMode = 'candidate' | 'discarded';
const currentTab = ref<TabMode>('candidate');

// SUB-FILTERS (Candidate Tab)
// User Feedback: Match filters to Urgency levels (0-3) instead of mapped Status groups
type FilterType = 'all' | 'now' | 'discard' | 'hesitate' | 'keep';
const currentFilter = ref<FilterType>('all');
const selectedTag = ref<string | null>(null);

const allItems = useLiveQuery(
  () => db.items.orderBy('updatedAt').reverse().toArray(),
  [] as Item[]
);

// ... availableTags logic stays same ...
const availableTags = computed(() => {
  const items = allItems.value || [];
  const candidates = items.filter(i => i.status !== 'discarded');
  
  const tagCounts = new Map<string, number>();
  candidates.forEach(i => {
    i.blockers.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
});

const filteredItems = computed(() => {
  const items = allItems.value || [];
  
  if (currentTab.value === 'discarded') {
    return items.filter(i => i.status === 'discarded');
  } else {
    // CANDIDATE TAB
    // Filter by status first (exclude discarded)
    let candidates = items.filter(i => i.status !== 'discarded');
    
    // 1. Urgency Filter (More granular)
    if (currentFilter.value === 'now') {
      candidates = candidates.filter(i => i.urgency === 3);
    } else if (currentFilter.value === 'discard') {
      candidates = candidates.filter(i => i.urgency === 2);
    } else if (currentFilter.value === 'hesitate') {
      candidates = candidates.filter(i => i.urgency === 1);
    } else if (currentFilter.value === 'keep') {
      candidates = candidates.filter(i => i.urgency === 0);
    }
    
    // 2. Tag Filter
    if (selectedTag.value) {
      candidates = candidates.filter(i => i.blockers.includes(selectedTag.value!));
    }
    
    return candidates.sort((a, b) => {
      if (b.urgency !== a.urgency) return b.urgency - a.urgency;
      return b.updatedAt - a.updatedAt;
    });
  }
});

const toggleTag = (tag: string) => {
  if (selectedTag.value === tag) {
    selectedTag.value = null;
  } else {
    selectedTag.value = tag;
  }
};

const goCapture = () => {
  router.push('/capture');
};

const goDetails = (id: string) => {
  router.push(`/items/${id}`);
};

// Theme Toggle
const isDark = ref(document.documentElement.classList.contains('dark'));
const toggleTheme = () => {
  const html = document.documentElement;
  if (html.classList.contains('dark')) {
    html.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    isDark.value = false;
  } else {
    html.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    isDark.value = true;
  }
};
</script>

<template>
  <div class="workbench-page">
    
    <!-- HEADER AREA -->
    <header class="main-header">
      <h1 class="app-title">不断捨離</h1>
      <div class="header-actions">
        <button class="icon-btn-ghost" @click="toggleTheme">
          <component :is="isDark ? Sun : Moon" :size="24" />
        </button>
      </div>
    </header>

    <!-- MAIN CONTENT -->
    <main class="content-area">
      
      <!-- SUB-FILTERS (Only in Candidate Tab) -->
      <div v-if="currentTab === 'candidate'" class="filters-container">
        
        <!-- Level 1: Urgency (Granular) -->
        <div class="status-filters">
          <button 
            :class="{ active: currentFilter === 'all' }" 
            @click="currentFilter = 'all'"
          >
            全部
          </button>
          <button 
            :class="{ active: currentFilter === 'now' }" 
            @click="currentFilter = 'now'"
          >
            <Flame :size="16" />
            今すぐ
          </button>
          <button 
            :class="{ active: currentFilter === 'discard' }" 
            @click="currentFilter = 'discard'"
          >
            <Trash2 :size="16" />
            捨てたい
          </button>
          <button 
            :class="{ active: currentFilter === 'hesitate' }" 
            @click="currentFilter = 'hesitate'"
          >
            <HelpCircle :size="16" />
            迷い
          </button>
          <button 
            :class="{ active: currentFilter === 'keep' }" 
            @click="currentFilter = 'keep'"
          >
            <Package :size="16" />
            残す
          </button>
        </div>

        <!-- Level 2: Tags (Scrollable) -->
        <div class="tags-filters" v-if="availableTags.length > 0">
          <button 
            v-for="tag in availableTags"
            :key="tag"
            class="tag-chip"
            :class="{ active: selectedTag === tag }"
            @click="toggleTag(tag)"
          >
            #{{ tag }}
          </button>
        </div>

      </div>

      <!-- DISCARDED HEADER INFO -->
      <!-- DISCARDED HEADER INFO -->
      <div v-if="currentTab === 'discarded'" class="discarded-header">
        <div class="zen-divider"></div>
        <div class="header-content">
          <Scroll :size="16" />
          <p>手放した記録</p>
        </div>
        <div class="zen-divider"></div>
      </div>

      <!-- ITEM LIST -->
      <div v-if="filteredItems.length > 0" class="item-list">
        <ItemCard 
          v-for="item in filteredItems" 
          :key="item.id" 
          :item="item"
          @click="goDetails"
        />
      </div>

      <!-- Empty State (Centered) -->
      <div v-else class="empty-state">
        <div class="empty-content">
          <p v-if="currentTab === 'candidate'">候補はまだありません</p>
          <p v-else>手放したものはまだありません</p>
        </div>
      </div>
    </main>

    <!-- Floating CTA -->
    <div class="floating-cta">
      <button @click="goCapture">
        <Camera :size="20" />
        <span>捨てるか迷ったら撮る</span>
      </button>
    </div>

    <!-- BOTTOM TAB BAR -->
    <nav class="bottom-tabs">
      <button 
        :class="{ active: currentTab === 'candidate' }" 
        @click="currentTab = 'candidate'"
      >
        <GripHorizontal :size="28" />
        <span>候補</span>
      </button>
      <button 
        :class="{ active: currentTab === 'discarded' }" 
        @click="currentTab = 'discarded'"
      >
        <Scroll :size="24" />
        <span>捨離</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.workbench-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg);
}

.main-header {
  padding: 1.5rem 1rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-bg); /* Blend with body */
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-btn-ghost {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--color-text);
  transition: background 0.2s;
}

.icon-btn-ghost:active {
  background: rgba(0,0,0,0.05);
}

.app-title {
  font-family: var(--font-serif);
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: 0.05em;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 0 1rem;
  padding-bottom: calc(5rem + 70px); 
  display: flex;
  flex-direction: column;
}

/* FILTERS */
.filters-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-shrink: 0;
  padding-top: 0.5rem;
}

.status-filters {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.status-filters::-webkit-scrollbar { display: none; }

.status-filters button {
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid transparent;
  box-shadow: var(--shadow-sm);
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-filters button.active {
  background: var(--color-primary);
  color: var(--color-surface);
  font-weight: 600;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.tags-filters {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.tags-filters::-webkit-scrollbar { display: none; }

.tag-chip {
  flex-shrink: 0;
  padding: 0.4rem 1rem;
  border-radius: var(--radius-full);
  background: transparent;
  border: 1px solid rgba(0,0,0,0.1);
  font-size: 0.8rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  transition: all 0.2s;
}

.tag-chip.active {
  background: rgba(0,0,0,0.05); /* Subtle active state for tags */
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 600;
}

/* ITEM GRID */
.item-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  width: 100%;
  padding-bottom: 2rem;
}

.empty-state {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: var(--color-text-muted);
}

.floating-cta {
  position: fixed;
  bottom: calc(70px + 1.5rem);
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 50; 
}

.floating-cta button {
  pointer-events: auto;
  background-color: var(--color-primary);
  color: var(--color-surface);
  padding: 1rem 2.5rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: var(--shadow-floating);
  font-weight: 700;
  font-size: 1rem;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.floating-cta button:active {
  transform: scale(0.95);
}

/* BOTTOM TABS - Glassmorphism */
.bottom-tabs {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 85px; /* Taller for modern feel */
  background: rgba(255, 255, 255, 0.9);
  background: var(--color-surface);
  border-top: 1px solid rgba(0,0,0,0.05);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem; /* Spacing between tabs */
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -10px 30px rgba(0,0,0,0.02);
  z-index: 100;
}

.bottom-tabs button {
  flex: 0 1 120px; /* Limits width */
  height: 50px; /* Compact height */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  color: var(--color-text-muted);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  border-radius: 12px; /* For pill effect if needed, though we use text color mostly */
}

.bottom-tabs button.active {
  color: var(--color-primary);
  transform: translateY(-2px);
}

/* Active Indicator Dot Removed */

.bottom-tabs button span {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

/* Discarded Header Styling */
.discarded-header {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  opacity: 0.8;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 0.9rem;
  letter-spacing: 0.1em;
}

.zen-divider {
  height: 1px;
  width: 40px;
  background: currentColor;
  opacity: 0.2;
}
</style>
