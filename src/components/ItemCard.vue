<script setup lang="ts">
import { computed } from 'vue';
import type { Item } from '../lib/db';
import { Flame, Trash2, HelpCircle, Package } from 'lucide-vue-next';

const props = defineProps<{
  item: Item;
}>();

const emit = defineEmits<{
  (e: 'click', id: string): void;
}>();

const urgencyConfig = computed(() => {
  switch (props.item.urgency) {
    case 3: return { label: '今すぐ', icon: Flame, color: 'text-red', bg: '#fee2e2' };
    case 2: return { label: '捨てたい', icon: Trash2, color: 'text-orange', bg: '#ffedd5' };
    case 1: return { label: '迷い', icon: HelpCircle, color: 'text-yellow', bg: '#fef9c3' };
    case 0: return { label: '残す', icon: Package, color: 'text-green', bg: '#dcfce7' };
    default: return { label: '迷い', icon: HelpCircle, color: 'text-yellow', bg: '#fef9c3' };
  }
});

const timeAgo = (ts: number) => {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今日';
  if (days < 7) return `${days}日前`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
</script>

<template>
  <div class="photo-card" @click="emit('click', item.id)">
    <div class="image-container">
      <img :src="item.imageData" loading="lazy" />
      
      <!-- Urgency Badge (Unique Icon) -->
      <div class="urgency-badge" :class="urgencyConfig.color">
        <component :is="urgencyConfig.icon" :size="14" />
        <span class="label">{{ urgencyConfig.label }}</span>
      </div>
    </div>
    
    <div class="meta-info">
      <div class="tags-row" v-if="item.blockers && item.blockers.length > 0">
        <span class="mini-tag" v-for="tag in item.blockers.slice(0, 2)" :key="tag">
          {{ tag }}
        </span>
        <span v-if="item.blockers.length > 2" class="mini-tag-more">
          +
        </span>
      </div>
      <div v-else class="tags-placeholder">
        <!-- Spacer -->
      </div>
      
      <div class="date-row">
        {{ timeAgo(item.updatedAt) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.photo-card {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.12); /* Increased contrast */
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: transform 0.1s;
}

.photo-card:active {
  transform: scale(0.98);
}

.image-container {
  aspect-ratio: 1 / 1;
  width: 100%;
  position: relative;
  background: #f0f0f0;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.urgency-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  padding: 4px 8px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.urgency-badge.text-red { color: #dc2626; }
.urgency-badge.text-orange { color: #ea580c; }
.urgency-badge.text-yellow { color: #ca8a04; }
.urgency-badge.text-green { color: #16a34a; }

.meta-info {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 20px;
}

.tags-placeholder {
  min-height: 20px;
}

.mini-tag {
  font-size: 0.65rem;
  background: var(--color-bg);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--color-text-muted);
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 1px solid rgba(0,0,0,0.05);
}

.mini-tag-more {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  align-self: center;
}

.date-row {
  font-size: 0.65rem;
  color: #9ca3af;
  text-align: right;
}
</style>
