<script setup lang="ts">
import { useDisplay } from 'vuetify/lib/framework.mjs';
import { HistoryManager } from './composables/history-manager';
import { FilesManager, supportedExtensions, imageExtensions } from './composables/files-manager';
import type { iFile } from "composables/worker/7zip-manager"
import { videoExtensions, binaryExtensions } from '#imports';

let display = useDisplay();
let drawer = ref(!display.mdAndDown.value);
let loadingModel = ref(false);
let files = ref([]);

let filesList = ref<iFile[]>([]);
let selectedPath = useSelectedPath();
let filesGridList = ref<any>([])
let selectedList = ref<any>([]);
let filesManager = new FilesManager(filesList);
let history = new HistoryManager(filesManager);
let mediaBlobUrl = ref('');
let errorDialog = ref(false);
let errorMessage = ref('');

watchEffect(async () => {
  if (files.value?.[0]) {
    loadingModel.value = true;
    filesList.value = [];

    try {
      await filesManager.loadArchive(files.value?.[0]);
    } catch (error: any) {
      errorMessage.value = error.message;
      errorDialog.value = true;
      files.value = [];
    }
    loadingModel.value = false;
  }
})

function onDrop(e: any) {
  if (!e.dataTransfer.files.length) return;
  files.value = e.dataTransfer.files;
  selectedPath.value = '/';
}

function preventDefaults(e: Event) {
  e.preventDefault()
}

const events = ['dragenter', 'dragover', 'dragleave', 'drop']

onMounted(() => {
  events.forEach((eventName) => {
    document.body.addEventListener(eventName, preventDefaults)
  })
})

onUnmounted(() => {
  events.forEach((eventName) => {
    document.body.removeEventListener(eventName, preventDefaults)
  })
})

watchEffect(async () => {
  const file = filesManager.getFile(selectedPath.value);
  filesGridList.value = file?.content;

  // Update to handle both video and image files
  if (videoExtensions.includes(filesManager.getFile(selectedPath.value)?.extension?.toLowerCase()) ||
    imageExtensions.includes(filesManager.getFile(selectedPath.value)?.extension?.toLowerCase())) {
    mediaBlobUrl.value = await filesManager.getFileBlobUrl(selectedPath.value) as string;
  }
})

// step up from current path
function stepUp(path: string) {
  const pathArray = path.split("/");
  pathArray.pop();
  return (pathArray.join("/") || "/");
}

</script>
<template>
  <v-layout @drop.prevent="onDrop">
    <v-app-bar color="light-blue-darken-1">
      <v-btn variant="text" icon="mdi-menu" v-slot:prepend @click="drawer = !drawer"></v-btn>
      <v-toolbar-title>Extractify.zip</v-toolbar-title>
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" :permanent="!display.xs">
      <v-toolbar density="comfortable" title="Files">
        <template v-slot:prepend>
          <v-btn icon="mdi-home" @click="selectedPath = '/'"></v-btn>
        </template>
      </v-toolbar>
      <TreeView :filesList="filesList" :nav=true></TreeView>
      <v-footer class="d-flex w-100 flex-column" style="position: absolute;bottom: 0;">
        <div class="d-flex w-100 align-center">
          <a href="https://github.com/xlmnxp/extractify.zip" target="_blank" class="text-subtitle-2"
            style="text-decoration: underline;text-decoration-style: dotted">Source Code</a>
          <v-spacer></v-spacer>
          <v-btn class="mx-4" icon="mdi-github" variant="plain" size="small"
            href="https://github.com/xlmnxp/extractify.zip" target="_blank"></v-btn>
        </div>
      </v-footer>
    </v-navigation-drawer>
    <v-main style="height: 100dvh;">
      <v-toolbar class="px-5" height="auto">
        <v-row align="center" justify="center">
          <v-col cols="12" lg="2" md="12" style="display: inline-flex;">
            <v-btn title="Back" aria-label="Back" icon="mdi-arrow-left" :disabled="!history.hasUndo.value"
              @click="history.undo();"></v-btn>
            <v-btn title="Forward" aria-label="Forward" icon="mdi-arrow-right" :disabled="!history.hasRedo.value"
              @click="history.redo();"></v-btn>
            <v-btn title="Refresh" aria-label="Refresh" icon="mdi-refresh" :disabled="!files.length"
              @click="history.refresh();"></v-btn>
            <v-btn title="Parent Folder" aria-label="Parent Folder" icon="mdi-arrow-up" :disabled="selectedPath == '/'"
              @click="selectedPath = stepUp(selectedPath);"></v-btn>
          </v-col>
          <v-col cols="10" lg="8" md="10">
            <v-text-field :disabled="!files.length" hide-details title="Location" single-line placeholder="location"
              v-model="selectedPath"></v-text-field>
          </v-col>
          <v-col cols="2">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn :disabled="!files.length" title="Menu" aria-label="Menu" icon="mdi-dots-vertical"
                  v-bind="props"></v-btn>
              </template>
              <v-list>
                <v-list-item title="Close" aria-label="Close" icon="mdi-close"
                  @click="files = []; selectedPath = '/'; selectedList = []; filesGridList = []; filesList = []; history.reset()">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-close"></v-icon>
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>
        </v-row>
      </v-toolbar>
      <v-container style="max-width: 100%">
        <template v-if="filesManager.getFile(selectedPath)?.isFolder">
          <FolderViewer :filesManager="filesManager" :filesGridList="filesGridList" :selectedList="selectedList"></FolderViewer>
        </template>
        <template
          v-if="!filesManager.getFile(selectedPath)?.isFolder && videoExtensions.includes(filesManager.getFile(selectedPath)?.extension)">
          <MediaVideoPlayer :src="mediaBlobUrl"></MediaVideoPlayer>
        </template>
        <template
          v-if="!filesManager.getFile(selectedPath)?.isFolder && imageExtensions.includes(filesManager.getFile(selectedPath)?.extension)">
          <MediaImageViewer :src="mediaBlobUrl"></MediaImageViewer>
        </template>
        <template
          v-if="!filesManager.getFile(selectedPath)?.isFolder && files.length && !imageExtensions.includes(filesManager.getFile(selectedPath)?.extension) && !videoExtensions.includes(filesManager.getFile(selectedPath)?.extension) && !binaryExtensions.includes(filesManager.getFile(selectedPath)?.extension)">
          <MediaTextEditor :file="filesManager.getFile(selectedPath)" :filesManager="filesManager"></MediaTextEditor>
        </template>
        <template
          v-if="!filesManager.getFile(selectedPath)?.isFolder && files.length && binaryExtensions.includes(filesManager.getFile(selectedPath)?.extension)">
          <MediaBinaryViewer :file="filesManager.getFile(selectedPath)" :filesManager="filesManager"></MediaBinaryViewer>
        </template>
        <template v-if="!files.length">
          <!-- tutorial drag and drop zipped file here and review it securely -->
          <v-row align="center" justify="center" style="height: calc(100vh - 120px)">
            <v-col cols="12">
              <v-card variant="flat" class="mx-auto" max-width="768">
                <!-- v-icon for file -->
                <v-icon class="mx-auto" size="100">mdi-file</v-icon>
                <v-card-title>Drag and Drop Compressed Files</v-card-title>
                <v-card-text class="font-weight-bold">
                  Extract and Explore compressed files online and securely.
                  <p class="text-subtitle-2 font-weight-regular text-medium-emphasis">
                    <v-icon class="mx-auto" size="1em" color="#007B4F">mdi-shield</v-icon> <strong>nothing</strong>
                    leave
                    your browser
                  </p>
                </v-card-text>

                <!-- file input -->
                <v-file-input class="mx-5" v-model="files"
                  :accept="supportedExtensions.map(extension => `.${extension}`).join(',')" label="or select a file..."
                  variant="outlined"></v-file-input>
              </v-card>
            </v-col>
          </v-row>
        </template>
      </v-container>
    </v-main>
    <v-dialog v-model="loadingModel" persistent width="auto">
      <v-card>
        <v-card-text>
          Please stand by
          <v-progress-linear indeterminate color="light-blue-darken-1" class="mb-0"></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="errorDialog" width="auto">
      <v-card>
        <v-card-title class="text-error">
          Error
        </v-card-title>
        <v-card-text>
          {{ errorMessage }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="errorDialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>
<style>
.v-list-item {
  border: 2px solid transparent;
}

.selected {
  background: rgba(48, 150, 243, 0.1);
}

.v-container {
  height: calc(100vh - 120px);
  padding: 0;
}
</style>