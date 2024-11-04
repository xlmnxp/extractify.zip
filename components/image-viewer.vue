<script lang="ts" setup>
const props = defineProps<{
  src: string;
}>();

const scale = ref(1);
const rotation = ref(0);

function zoomIn() {
  scale.value = Math.min(scale.value + 0.1, 3);
}

function zoomOut() {
  scale.value = Math.max(scale.value - 0.1, 0.1);
}

function resetZoom() {
  scale.value = 1;
  rotation.value = 0;
}

function rotateImage() {
  rotation.value = (rotation.value + 90) % 360;
}
</script>

<template>
  <div class="image-viewer">
    <div class="image-controls">
      <v-btn icon="mdi-plus" @click="zoomIn" title="Zoom In"></v-btn>
      <v-btn icon="mdi-minus" @click="zoomOut" title="Zoom Out"></v-btn>
      <v-btn icon="mdi-rotate-right" @click="rotateImage" title="Rotate"></v-btn>
      <v-btn icon="mdi-refresh" @click="resetZoom" title="Reset"></v-btn>
    </div>
    <div class="image-container">
      <img :src="src" :style="{
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        transition: 'transform 0.2s ease-in-out'
      }" />
    </div>
  </div>
</template>

<style scoped>
.image-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.image-controls {
  padding: 8px;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
