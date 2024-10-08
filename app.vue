<script setup lang="ts">
import { getElementInfo } from "moveable";
import { VueSelecto } from "vue3-selecto";
import { useDisplay } from 'vuetify/lib/framework.mjs';
import { HistoryManager } from './composables/history-manager';
import { FilesManager } from './composables/files-manager';
import type { iFile } from "composables/worker/7zip-manager"

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

watchEffect(async () => {
  if (files.value?.[0]) {
    loadingModel.value = true;
    filesList.value = [];

    await filesManager.loadArchive(files.value?.[0]);
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

  selectedList.value = [];
  for (const selectedElement of document.querySelectorAll(".selectable.selected")) {
    selectedElement.classList.remove("selected");
  }

  // Experimental feature
  if (videoExtensions.includes(filesManager.getFile(selectedPath.value)?.extension?.toLowerCase())) {
    mediaBlobUrl.value = await filesManager.getFileBlobUrl(selectedPath.value) as string;
  }
})

const dragContainer = document.querySelector(".select-area");

function onSelectStart(e: any) {
  e.added.forEach((el: any) => {
    el.classList.add("selected");
    selectedList.value = [...selectedList.value, el?.__vnode?.ctx?.props?.value];
  });
  e.removed.forEach((el: any) => {
    el.classList.remove("selected");
    selectedList.value = selectedList.value.filter((value: string) => value != el?.__vnode?.ctx?.props?.value)
  });
}

function onSelectEnd(e: any) {
  e.afterAdded.forEach((el: any) => {
    el.classList.add("selected");
    selectedList.value = [...selectedList.value, el?.__vnode?.ctx?.props?.value];
  });
  e.afterRemoved.forEach((el: any) => {
    el.classList.remove("selected");
    selectedList.value = selectedList.value.filter((value: string) => value != el?.__vnode?.ctx?.props?.value)
  });
}

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
            style="text-decoration: underline;text-decoration-style: dotted">Open Source Licenses</a>
          <v-spacer></v-spacer>
          <v-btn class="mx-4" icon="mdi-github" variant="plain" size="small"
            href="https://github.com/xlmnxp/extractify.zip" target="_blank"></v-btn>
        </div>
      </v-footer>
    </v-navigation-drawer>
    <v-main class="select-area" style="height: 100dvh;">
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
      <v-container>
        <template v-if="filesManager.getFile(selectedPath)?.isFolder">
          <v-list :selected="[selectedPath]">
            <v-row no-gutters>
              <v-col cols="6" lg="2" md="3" sm="6" v-for="file of filesGridList" style="text-align: center;">
                <v-list-item class="position-relative ma-2 pa-5 selectable" active-color="light-blue-darken-4"
                  :value="file.path" rounded @click="selectedPath = file.path">
                  <v-menu v-if="!file.isFolder">
                    <template v-slot:activator="{ props }">
                      <v-btn class="position-absolute" style="right: 0; top: 0;" icon="mdi-dots-vertical" variant="text"
                        v-bind="props"></v-btn>
                    </template>
                    <v-list>
                      <v-list-item title="Download" aria-label="Download" icon="mdi-download"
                        @click="filesManager.downloadFile(file.path)">
                        <template v-slot:prepend>
                          <v-icon icon="mdi-download"></v-icon>
                        </template>
                      </v-list-item>
                    </v-list>
                  </v-menu>

                  <file-logo class="mb-2" :file="file" :key="file.path" />
                  <p>{{ file.name }}</p>
                </v-list-item>
              </v-col>
            </v-row>
          </v-list>
        </template>
        <template
          v-if="!filesManager.getFile(selectedPath)?.isFolder && videoExtensions.includes(filesManager.getFile(selectedPath)?.extension)">
          <MediaVideoPlayer :src="mediaBlobUrl"></MediaVideoPlayer>
        </template>
        <template
          v-if="!filesManager.getFile(selectedPath)?.isFolder && files.length && !videoExtensions.includes(filesManager.getFile(selectedPath)?.extension)">
          <TextEditor :file="filesManager.getFile(selectedPath)" :filesManager="filesManager"></TextEditor>
        </template>
        <template v-if="!files.length">
          <!-- tutorial drag and drop zipped file here and review it securely -->
          <v-row align="center" justify="center">
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
                <v-file-input class="mx-5" v-model="files" accept=".zip,.7z,.rar,.tar.bz2,.tar.gz,.tar.xz"
                  label="or select a file..." variant="outlined"></v-file-input>
              </v-card>
            </v-col>
          </v-row>
        </template>
      </v-container>

      <VueSelecto :selectableTargets="['.selectable']" :dragContainer="dragContainer" :hitRate="0"
        :selectFromInside="false" :toggleContinueSelect="'ctrl'" @select="onSelectStart" @selectStart="onSelectStart"
        :get-element-rect="getElementInfo" @selectEnd="onSelectEnd" :select-by-click="false" />
    </v-main>
    <v-dialog v-model="loadingModel" persistent width="auto">
      <v-card>
        <v-card-text>
          Please stand by
          <v-progress-linear indeterminate color="light-blue-darken-1" class="mb-0"></v-progress-linear>
        </v-card-text>
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
</style>