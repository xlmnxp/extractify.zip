<script setup lang="ts">
import { Archive } from 'libarchive.js/main.js';
import { CompressedFile } from 'libarchive.js/src/compressed-file';
import { getElementInfo } from "moveable";
import { VueSelecto } from "vue3-selecto";
import { useDisplay } from 'vuetify/lib/framework.mjs';

Archive.init({
  workerUrl: '/worker-bundle.js',
});

let display = useDisplay();
let drawer = ref(!display.xs.value);
let loadingModel = ref(false);
let files = ref([]);

let filesList = ref<any>([]);
let selectedItem = useSelectedItem();
let filesGridList = ref<any>([])
let selectedList = ref<any>([])

watchEffect(async () => {
  if (files.value?.[0]) {
    loadingModel.value = true;
    filesList.value = [];

    const archive = await Archive.open(files.value[0]);

    let extractedFiles = await archive.getFilesObject();

    let getContent = (fileList: any, path = ''): any => {
      return Object.keys(fileList).map(file => ({
        name: file,
        path: `${path}/${file}${!(fileList[file] instanceof File || fileList[file] instanceof CompressedFile) ? '/' : ''}`,
        isFolder: !(fileList[file] instanceof File || fileList[file] instanceof CompressedFile),
        content: !(fileList[file] instanceof File || fileList[file] instanceof CompressedFile) && fileList[file] ? getContent(fileList[file], `${path}/${file}`)?.sort((a: any, b: any) => {
          return b.isFolder - a.isFolder
        }) : fileList[file]
      }))
    }

    filesList.value = getContent(extractedFiles)?.sort((a: any, b: any) => {
      return b.isFolder - a.isFolder
    });
    loadingModel.value = false;
  }
})

function onDrop(e: any) {
  if(!e.dataTransfer.files.length) return;
  files.value = e.dataTransfer.files;
  selectedItem.value = '/';
}

function preventDefaults(e: any) {
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

function getFile(path: string, innerList = undefined): any {
  if (path == "/") {
    return {
      content: filesList.value
    };
  }

  for (const file of (innerList || filesList.value)) {
    if (file.path == path) {
      return file;
    }

    if (file.isFolder && path.includes(file.path)) {
      let recursiveFile = getFile(path, file.content);
      if (recursiveFile) {
        return recursiveFile;
      }
    }
  }

  return undefined;
}

watchEffect(() => {
  filesGridList.value = getFile(selectedItem.value)?.content || [];
  selectedList.value = [];

  for (const selectedElement of document.querySelectorAll(".selectable.selected")) {
    selectedElement.classList.remove("selected");
  }
})

watchEffect(() => {
  console.log(selectedList.value)
})


let dragContainer = document.querySelector(".select-area");

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
          <v-btn icon="mdi-home" @click="selectedItem = '/'"></v-btn>
        </template>
      </v-toolbar>
      <TreeView :filesList="filesList" :nav=true></TreeView>
    </v-navigation-drawer>
    <v-main class="select-area" style="height: 100vh;">
      <v-toolbar class="px-5" density="comfortable">
        <v-text-field hide-details single-line placeholder="location" v-model="selectedItem"></v-text-field>
      </v-toolbar>
      <template v-if="selectedItem.endsWith('/')">
        <v-container>
          <v-list :selected="[selectedItem]">
            <v-row no-gutters>
              <v-col cols="6" lg="2" md="3" sm="6" v-for="file of filesGridList" style="text-align: center;">
                <v-list-item class="ma-2 pa-5 selectable" active-color="light-blue-darken-4" :value="file.path"
                  rounded @click="() => {
                    selectedItem = file.path;
                  }">
                  <v-avatar class="mb-2" :color="file.isFolder ? 'light-blue-accent-4' : 'blue-grey-darken-1'">
                    <v-icon color="white">{{ file.isFolder ? 'mdi-folder' : 'mdi-file' }}</v-icon>
                  </v-avatar>
                  <p>{{ file.name }}</p>
                </v-list-item>
              </v-col>
            </v-row>
          </v-list>
        </v-container>
      </template>
      
      <VueSelecto :selectableTargets="['.selectable']" :dragContainer="dragContainer" :hitRate="20"
        :selectFromInside="false" :toggleContinueSelect="'ctrl'" @select="onSelectStart" @selectStart="onSelectStart"
        :get-element-rect="getElementInfo" @selectEnd="onSelectEnd" />
        
      <template v-if="!files.length">
        <!-- tutorial drag and drop zipped file here and review it securely -->
        <v-container fill-height fluid>
          <v-row align="center" justify="center">
            <v-col cols="12">
              <v-card variant="flat" class="mx-auto" max-width="768">
                <!-- v-icon for file -->
                <v-icon class="mx-auto" size="100">mdi-file</v-icon>
                <v-card-title>Drag and Drop Compressed Files</v-card-title>
                <v-card-text>
                  Review them securely.
                </v-card-text>

                <!-- file input -->
                <v-file-input class="mx-5" v-model="files" accept=".zip,.7z,.rar,.tar.bz2,.tar.gz,.tar.xz" label="or select a file..." variant="outlined"></v-file-input>
              </v-card>
            </v-col>
          </v-row>
        </v-container>        
      </template>
    </v-main>
    <v-dialog
      v-model="loadingModel"
      persistent
      width="auto"
    >
      <v-card>
        <v-card-text>
          Please stand by
          <v-progress-linear
            indeterminate
            color="light-blue-darken-1"
            class="mb-0"
          ></v-progress-linear>
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
  border: 2px solid rgba(48, 150, 243, 0.95);
  background: rgba(48, 150, 243, 0.1);
}
</style>