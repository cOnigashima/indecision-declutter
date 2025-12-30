<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db, type Item, type ItemStatus } from '../lib/db';
import { ArrowLeft, Trash2, CheckCircle2, Scroll, MapPin, Calendar, DollarSign, Save } from 'lucide-vue-next';
import { useItems } from '../lib/useItems';

const route = useRoute();
const router = useRouter();
const itemId = route.params.id as string;
const item = ref<Item | undefined>(undefined);
const { updateItem } = useItems();
const dateInputRef = ref<HTMLInputElement | null>(null);

const openDatePicker = () => {
  if (dateInputRef.value && 'showPicker' in dateInputRef.value) {
    (dateInputRef.value as any).showPicker();
  } else {
    dateInputRef.value?.focus();
  }
};

// Options
const blockersList = [
  'まだ使える', '高かった', 'もらい物', '思い出', 
  'いつか使う', '代替が不安', '捨て方が面倒', 
  '置き場所がある', 'また買いそう'
];

onMounted(async () => {
  if (itemId) {
    item.value = await db.items.get(itemId);
  }
});

const save = async () => {
  if (!item.value) return;
  item.value.updatedAt = Date.now();
  await updateItem(JSON.parse(JSON.stringify(item.value)));
};

const toggleBlocker = async (tag: string) => {
  if (!item.value) return;
  const current = item.value.blockers || [];
  if (current.includes(tag)) {
    item.value.blockers = current.filter(t => t !== tag);
  } else {
    item.value.blockers = [...current, tag];
  }
  await save();
};

const handleLetGo = async () => {
  if (!item.value) return;
  if (confirm('このアイテムを手放しますか？\n（捨離リストへ移動します）')) {
    item.value.status = 'discarded';
    await save();
    // Ideally we verify the transition or show animation, then go back
    router.back();
  }
};

const handleRestore = async () => {
  if (!item.value) return;
  item.value.status = 'hold'; // Restore to hold
  await save();
  alert('候補リストに戻しました。');
};

const handleDelete = async () => {
  if (confirm('本当に削除しますか？\n（データ自体が完全に消えます）')) {
    await db.items.delete(itemId);
    router.back();
  }
};

const goBack = () => {
  router.back();
};

const onFieldChange = async () => {
  await save();
};

const handleManualSave = async () => {
  await save();
  alert('保存しました');
};
</script>

<template>
  <div class="details-page" v-if="item">
    <header>
      <button @click="goBack" class="icon-btn">
        <ArrowLeft />
      </button>
      <div class="actions">
        <button @click="handleDelete" class="icon-btn danger">
          <Trash2 />
        </button>
      </div>
    </header>

    <main>
      <!-- Image Hero -->
      <div class="image-hero">
        <img :src="item.imageData" alt="Item" />
        <div class="status-overlay" v-if="item.status === 'discarded'">
          <span class="badge-discarded">手放し済み</span>
        </div>
      </div>

      <!-- Main Action Area -->
      <div class="section action-section">
        <div v-if="item.status !== 'discarded'">
          <button class="let-go-btn" @click="handleLetGo">
            <Scroll :size="20" />
            <span>手放す（断捨離完了）</span>
          </button>
          <p class="helper-text">手放した時や、決心がついた時に押してください</p>
        </div>
        <div v-else>
          <div class="completed-msg">
            <CheckCircle2 :size="32" class="text-green" />
            <p>このモノとの関係は完了しました</p>
          </div>
          <button class="text-link" @click="handleRestore">候補に戻す</button>
        </div>
      </div>

      <!-- Attributes (Optional) -->
      <div class="section attributes-section">
        <h3>基本情報（任意）</h3>
        <div class="field-row">
          <div class="field-icon"><DollarSign :size="16" /></div>
          <input 
            v-model="item.pricePrediction" 
            @change="onFieldChange"
            placeholder="購入価格（例: 3000円、高かった）" 
          />
        </div>
        <label class="field-row clickable-row" @click.prevent="openDatePicker">
          <div class="field-icon"><Calendar :size="16" /></div>
          <div class="field-content">
            <span class="field-label-top">最後に使った日</span>
            <input 
              ref="dateInputRef"
              type="date"
              v-model="item.lastUsed" 
              @change="onFieldChange"
              class="full-date-input"
              @click.stop
            />
          </div>
        </label>
        <div class="field-row">
          <div class="field-icon"><MapPin :size="16" /></div>
          <input 
            v-model="item.storageLocation" 
            @change="onFieldChange"
            placeholder="保管場所" 
          />
        </div>
      </div>

      <!-- Blockers -->
      <div class="section">
        <h3>捨てられない理由</h3>
        <div class="tags-grid">
          <button 
            v-for="tag in blockersList" 
            :key="tag"
            :class="{ active: item.blockers?.includes(tag) }"
            @click="toggleBlocker(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <!-- Memory Note -->
      <div class="section">
        <h3>モノへの想い・メモ</h3>
        <textarea 
          v-model="item.memoryNote"
          @change="onFieldChange"
          placeholder="思い出、迷っている理由、感謝の言葉など..."
          rows="4"
        ></textarea>
      </div>

      <!-- Explicit Save Button (Bottom Spacer for FAB) -->
      <div class="save-spacer"></div>
    </main>

    <!-- Floating Save Button -->
    <div class="save-fab-container">
      <button class="save-fab" @click="handleManualSave">
        <Save :size="20" />
        <span>保存</span>
      </button>
    </div>
  </div>
  <div v-else class="loading">
    Loading...
  </div>
</template>

<style scoped>
.details-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

.icon-btn {
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(4px);
  padding: 0.5rem;
  border-radius: 50%;
  color: var(--color-text);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: none;
}

.icon-btn.danger {
  color: #ef4444;
}

main {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 2rem;
}

.image-hero {
  width: 100%;
  height: 40vh;
  background: var(--color-bg); /* Match theme background */
  position: relative;
}

.image-hero img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.status-overlay {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
}

.badge-discarded {
  background: var(--color-text);
  color: var(--color-bg);
  padding: 4px 12px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.8rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.section {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  background: var(--color-surface);
}

.section h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.action-section {
  text-align: center;
  padding: 2rem 1rem;
}

.let-go-btn {
  width: 100%;
  padding: 1rem;
  background: var(--color-text);
  color: var(--color-bg);
  border-radius: var(--radius-md);
  font-weight: 700;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  box-shadow: var(--shadow-md);
}

.helper-text {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.completed-msg {
  display: flex;
  flex-direction: column;
  items-align: center;
  gap: 0.5rem;
  color: var(--color-text);
  font-weight: 600;
  margin-bottom: 1rem;
}

.text-green {
  color: #10b981;
}

.text-link {
  background: none;
  border: none;
  text-decoration: underline;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

/* Attributes */
.attributes-section .field-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px dashed rgba(0,0,0,0.05);
}

.attributes-section .field-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.field-icon {
  width: 24px;
  display: flex;
  justify-content: center;
  color: var(--color-text-muted);
}

.attributes-section input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: var(--color-text);
  font-family: inherit;
}

.attributes-section input:focus {
  outline: none;
}

.field-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

/* Tags Grid */
.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tags-grid button {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: var(--color-bg);
  color: var(--color-text-muted);
  font-size: 0.9rem;
  border: 1px solid rgba(0,0,0,0.05);
}

.tags-grid button.active {
  background: var(--color-text);
  color: var(--color-bg);
  font-weight: 600;
}

textarea {
  width: 100%;
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(0,0,0,0.1);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
}

.loading {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color-text-muted);
}

/* Date Input Improvements */
.clickable-row {
  cursor: pointer;
  position: relative;
}

.field-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.field-label-top {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  margin-bottom: 2px;
}

.full-date-input {
  width: 100%;
  font-size: 1rem;
  font-family: inherit;
  color: var(--color-text);
  background: transparent;
  padding: 0;
  margin: 0;
}

/* Save FAB */
.save-spacer {
  height: 80px;
}

.save-fab-container {
  position: fixed;
  bottom: 2rem;
  right: 1.5rem;
  z-index: 20;
}

.save-fab {
  background-color: var(--color-text);
  color: var(--color-bg);
  padding: 1rem 1.5rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: var(--shadow-floating);
  font-weight: 700;
  border: none;
  transition: transform 0.2s;
}

.save-fab:active {
  transform: scale(0.95);
}
</style>
