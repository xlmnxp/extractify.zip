<script lang="ts" setup>
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { ref, onMounted } from 'vue'
import { FilesManager } from '~/composables/files-manager';
// @ts-ignore
import { iFile } from '~/composables/worker/7zip-manager';

interface Props {
  file: iFile,
  filesManager: FilesManager
}

const editor = ref()

let { file, filesManager } = defineProps<Props>()

// files manager
onMounted(async () => {
  const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches

  let fileContent = await filesManager.getFileContent(file.path);
  monaco.editor.create(editor.value, {
    value: fileContent?.toString()!,
    language: file.extension,
    readOnly: true,
    theme: darkMode ? 'vs-dark' : 'vs-light'
  })
})
</script>

<template>
  <div id="editor" ref="editor"></div>
</template>

<style scoped>
#editor {
  width: 100vw;
  height: 100vh;
}
</style>
