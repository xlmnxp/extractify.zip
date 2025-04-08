<script lang="ts" setup>
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { ref, onMounted } from 'vue'
import { FilesManager } from '~/composables/files-manager';
import type { iFile } from '~/composables/worker/7zip-manager';

interface Props {
  file: iFile,
  filesManager: FilesManager
}

const editorPlaceholder = ref()
let monacoEditor: monaco.editor.IStandaloneCodeEditor | null = null;

let { file, filesManager } = defineProps<Props>()

// files manager
onMounted(async () => {
  const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches

  if(!file || file.isFolder) return;
  let fileContent = await filesManager.getFileContent(file.path);

  monacoEditor = monaco.editor.create(editorPlaceholder.value, {
    value: fileContent?.toString()!,
    readOnly: true,
    theme: darkMode ? 'vs-dark' : 'vs-light'
  })
})

watchEffect(async () => {
  if(!file || file.isFolder) return;
  let fileContent = await filesManager.getFileContent(file.path);

  monacoEditor?.setValue(fileContent?.toString()!);
})
</script>

<template>
  <div id="editor" ref="editorPlaceholder"></div>
</template>

<style scoped>
#editor {
  width: 100vw;
  height: calc(100vh - 120px);
}
</style>
