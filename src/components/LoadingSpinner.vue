<template>
  <div class="spinner">
    <div class="dot1"></div>
    <div class="dot2"></div>
  </div>
</template>

<style scoped>
.spinner {
  width: 40px;
  height: 40px;
  position: relative;
  margin: 100px auto;
}

.dot1, .dot2 {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: var(--color-text-muted);
  opacity: 0.6;
  position: absolute;
  top: 0;
  left: 0;
  animation: sk-bounce 2.0s infinite ease-in-out;
}

.dot2 {
  animation-delay: -1.0s;
}

@keyframes sk-bounce {
  0%, 100% { transform: scale(0.0) }
  50% { transform: scale(1.0) }
}
</style>
