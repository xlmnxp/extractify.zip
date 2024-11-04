<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { FilesManager } from '~/composables/files-manager';
import { iFile } from '~/composables/worker/7zip-manager';
import { VBtn } from 'vuetify/components';

interface Props {
  file: iFile,
  filesManager: FilesManager
}

const { file, filesManager } = defineProps<Props>()
const buffer = ref<Uint8Array>()
const containerRef = ref<HTMLElement>()
const isLoading = ref(true)
const rowHeight = 24 // pixels per row
const visibleRows = ref(0)
const scrollTop = ref(0)

// Calculate total rows and visible window
const totalRows = computed(() => buffer.value ? Math.ceil(buffer.value.length / 16) : 0)
const startRow = computed(() => Math.floor(scrollTop.value / rowHeight))
const endRow = computed(() => Math.min(startRow.value + visibleRows.value + 50, totalRows.value))

// Get only the visible rows data
const visibleData = computed(() => {
  if (!buffer.value) return []
  
  const rows = []
  for (let i = startRow.value; i < endRow.value; i++) {
    const offset = i * 16
    const chunk = buffer.value.slice(offset, offset + 16)
    const hex = Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join(' ')
    const ascii = Array.from(chunk).map(b => b >= 32 && b <= 126 ? String.fromCharCode(b) : '.').join('')
    
    rows.push({
      address: offset.toString(16).padStart(8, '0'),
      hex: hex.padEnd(48, ' '),
      ascii
    })
  }
  return rows
})

// Handle scroll events
function onScroll(event: Event) {
  const container = event.target as HTMLElement
  scrollTop.value = container.scrollTop
}

// Calculate visible rows based on container height
function updateVisibleRows() {
  if (containerRef.value) {
    visibleRows.value = Math.ceil(containerRef.value.clientHeight / rowHeight)
  }
}

function downloadBinaryFile() {
  filesManager.downloadFile(file.path);
}

onMounted(async () => {
  try {
    buffer.value = await filesManager.getFileContent(file.path, "binary") as Uint8Array
    updateVisibleRows()
    window.addEventListener('resize', updateVisibleRows)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="binary-viewer">
    <div class="toolbar">
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-download"
        @click="downloadBinaryFile"
        size="small"
      >
        Download {{ file.name }}
      </v-btn>
    </div>
    <div v-if="isLoading" class="loading">
      Loading...
    </div>
    <div
      v-else
      ref="containerRef"
      class="hex-container"
      @scroll="onScroll"
    >
      <div 
        class="scroll-content"
        :style="{
          height: `${totalRows * rowHeight}px`,
          paddingTop: `${startRow * rowHeight}px`
        }"
      >
        <div
          v-for="row in visibleData"
          :key="row.address"
          class="hex-line"
        >
          <span class="address">{{ row.address }}</span>
          <span class="hex">{{ row.hex }}</span>
          <span class="ascii">{{ row.ascii }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.binary-viewer {
  font-family: monospace;
  white-space: pre;
  padding: 1rem;
  background-color: var(--v-theme-surface);
  height: calc(100vh - 120px);
}

.hex-container {
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.scroll-content {
  position: absolute;
  width: 100%;
}

.hex-line {
  line-height: 1.5;
  height: v-bind(rowHeight + 'px');
}

.address {
  color: #666;
  margin-right: 1rem;
}

.hex {
  margin-right: 1rem;
}

.ascii {
  color: #666;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.toolbar {
  margin-bottom: 1rem;
  display: flex;
  justify-content: flex-end;
}
</style>
