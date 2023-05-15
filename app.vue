<script setup lang="ts">
import { Archive } from 'libarchive.js/main.js';
import { CompressedFile } from 'libarchive.js/src/compressed-file';
import { getElementInfo } from "moveable";
import { VueSelecto } from "vue3-selecto";

Archive.init({
  workerUrl: '/worker-bundle.js',
});

let drawer = ref(true);
let files = ref([]);

let filesList = ref<any>([]);
let selectedItem = useSelectedItem();

watchEffect(async () => {
  if (files.value?.[0]) {
    filesList.value = [];

    const archive = await Archive.open(files.value[0]);

    // console.log(await archive.getFilesObject())
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
  }
})

function onDrop(e: any) {
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

let filesGridList = ref<any>([])

watchEffect(() => {
  filesGridList.value = getFile(selectedItem.value)?.content || [];
})

let dragContainer = document.querySelector(".select-area");

function onSelectStart(e: any) {
  console.log("start", e);
  e.added.forEach((el: any) => {
    el.classList.add("selected");
  });
  e.removed.forEach((el: any) => {
    el.classList.remove("selected");
  });
}

function onSelectEnd(e: any) {
  console.log("end", e);
  e.afterAdded.forEach((el: any) => {
    el.classList.add("selected");
  });
  e.afterRemoved.forEach((el: any) => {
    el.classList.remove("selected");
  });
}

</script>
<template>
  <v-layout @drop.prevent="onDrop">
    <v-app-bar color="light-blue-darken-1">
      <v-btn variant="text" icon="mdi-menu" v-slot:prepend @click="drawer = !drawer"></v-btn>
      <v-toolbar-title>Uncompressed File</v-toolbar-title>
      <v-spacer></v-spacer>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" floating permanent>
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
              <v-col cols="6" sm="2" class="" v-for="file of filesGridList" style="text-align: center;">
                <v-list-item class="ma-2 pa-5 selectable" active-color="light-blue-darken-4" :value="file.path" rounded="xl" @click="() => {
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
        :selectFromInside="false" :toggleContinueSelect="'shift'" @select="onSelectStart" @selectStart="onSelectStart"
        :get-element-rect="getElementInfo"
        @selectEnd="onSelectEnd" />
      <h1 v-if="!files.length">Drag and drop compressed files here</h1>
    </v-main>
  </v-layout>
</template>
<style>
.v-list-item {
  border: 2px solid transparent;
}

.selected {
  border: 2px solid rgba(48,150,243, 0.95);
  background: rgba(48,150,243, 0.1);
}
</style>