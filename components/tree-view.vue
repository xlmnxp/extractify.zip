<script setup lang="ts">
import { CompressedFile } from 'libarchive.js/src/compressed-file';

interface Props {
    filesList: (File | CompressedFile) & { name: string, path: string, toggle: Boolean, isFolder: Boolean, content: any, active: boolean }[],
    nav: boolean
}

let { filesList, nav } = defineProps<Props>()
let selectedPath = useSelectedPath();

</script>
<template>
    <v-list :selected="[selectedPath]" density="compact" :nav="nav">
        <template v-for="file in filesList" :key="file.path">
            <v-list-item active-color="light-blue-darken-4" :active=file.active :title="file.name" :subtitle="file.path"
                :value="file.path" @click="() => {
                    selectedPath = file.path;
                    file.toggle = !file.toggle;
                }">
                <template v-slot:prepend>
                    <v-avatar :color="file.isFolder ? 'light-blue-accent-4' : 'blue-grey-darken-1'">
                        <v-icon color="white">{{ file.isFolder ? 'mdi-folder' : 'mdi-file' }}</v-icon>
                    </v-avatar>
                </template>
                <template v-if="file.isFolder" v-slot:append>
                    <v-icon>{{ `mdi-chevron-${file.toggle ? 'up' : 'down'}` }}</v-icon>
                </template>
            </v-list-item>
            <div v-if="file.isFolder && file.toggle"
                :style="`background-color: rgba(0,0,0,0.05);${nav ? `border-radius: 4px;` : ''}`">
                <TreeView :files-list="file.content" :nav="false"></TreeView>
            </div>
        </template>
    </v-list>
</template>