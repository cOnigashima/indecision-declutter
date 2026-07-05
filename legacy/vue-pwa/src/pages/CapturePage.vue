<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useItems } from '../lib/useItems';
import { ArrowLeft, Camera, Check, Flame, Trash2, HelpCircle, Package } from 'lucide-vue-next';
import type { UrgencyLevel } from '../lib/db';

const router = useRouter();
const { addItem } = useItems();

const fileInput = ref<HTMLInputElement | null>(null);
const imageSrc = ref<string | null>(null);
const urgency = ref<UrgencyLevel>(2);
const isSaving = ref(false);

const urgencyOptions = [
  { level: 3, label: '今すぐ', icon: Flame },
  { level: 2, label: '捨てたい', icon: Trash2 },
  { level: 1, label: '迷い', icon: HelpCircle },
  { level: 0, label: '残す', icon: Package },
];

const triggerCamera = () => {
  fileInput.value?.click();
};

// Image Compression Utility
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG 0.7
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const handleCapture = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    try {
      imageSrc.value = await compressImage(file);
    } catch (e) {
      console.error('Compression failed', e);
      // Fallback
      imageSrc.value = URL.createObjectURL(file);
    }
  }
};

const retake = () => {
  imageSrc.value = null;
  if (fileInput.value) fileInput.value.value = '';
};

// ... save function remains same ...

const goBack = () => {
  router.back();
};
</script>

<template>
  <div class="capture-page">
    
    <!-- PRE-CAPTURE STATE -->
    <div v-if="!imageSrc" class="pre-capture">
      <header>
        <button @click="goBack">
          <ArrowLeft />
        </button>
        <span>撮影</span>
      </header>
      
      <main>
        <div class="camera-trigger" @click="triggerCamera">
          <Camera :size="64" />
          <input 
            ref="fileInput"
            type="file" 
            accept="image/*" 
            capture="environment"
            @change="handleCapture"
            style="display: none"
          />
        </div>
        <p>捨てるか迷ったら撮る</p>
      </main>
    </div>

    <!-- PREVIEW & DECISION STATE -->
    <div v-else class="preview-mode">
      <div class="image-area">
        <img :src="imageSrc" alt="Preview" />
        <button class="retake-btn" @click="retake">
          <ArrowLeft :size="24" />
        </button>
      </div>

      <div class="controls-area">
        <h3>捨てたい度は？</h3>
        
        <div class="urgency-grid">
          <button 
            v-for="item in urgencyOptions" 
            :key="item.level"
            :class="{ active: urgency === item.level }"
            @click="urgency = (item.level as UrgencyLevel)"
          >
            <component :is="item.icon" :size="32" stroke-width="1.5" />
            <span class="label">{{ item.label }}</span>
          </button>
        </div>

        <button class="save-btn" @click="save" :disabled="isSaving">
          <span v-if="!isSaving">保存して次へ</span>
          <span v-else>保存中...</span>
          <Check v-if="!isSaving" :size="20" />
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.capture-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg);
}

/* Pre-capture Styles */
.pre-capture {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #000;
  color: white;
}

.pre-capture header {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-weight: 600;
}

.pre-capture header button {
  color: white;
}

.pre-capture main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
}

.camera-trigger {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.pre-capture p {
  opacity: 0.7;
}

/* Preview Styles */
.preview-mode {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.image-area {
  flex: 1;
  background-color: #000;
  position: relative;
  overflow: hidden;
}

.image-area img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.retake-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(0,0,0,0.5);
  color: white;
  padding: 0.5rem;
  border-radius: 50%;
}

.controls-area {
  padding: 1.5rem;
  background-color: var(--color-surface);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  margin-top: -24px;
  position: relative;
  z-index: 10;
}

.controls-area h3 {
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  color: var(--color-text-muted);
}

.urgency-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.urgency-grid button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.25rem;
  border-radius: var(--radius-md);
  background-color: transparent;
  color: var(--color-text-muted);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.urgency-grid button.active {
  background-color: var(--color-primary);
  color: white;
  transform: scale(1.05);
}

.urgency-grid button svg {
  margin-bottom: 4px;
}

.urgency-grid button .label {
  font-size: 0.75rem;
  font-weight: 600;
}

.save-btn {
  width: 100%;
  background-color: var(--color-accent);
  color: white;
  padding: 1rem;
  border-radius: var(--radius-full);
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

.save-btn:disabled {
  opacity: 0.7;
}
</style>
