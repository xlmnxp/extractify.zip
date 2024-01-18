<script lang="ts" setup>
import { iFile } from '~/composables/worker/7zip-manager';

interface Props {
    file: iFile,
}

let { file } = defineProps<Props>()

let icon = computed(() => {
    if (file.isFolder) return 'mdi-folder';
    
    if (file.extension) {
        if (videoExtensions.includes(file.extension!)) return 'mdi-video';
        if (audioExtensions.includes(file.extension!)) return 'mdi-music';
        if (imageExtensions.includes(file.extension!)) return 'mdi-image';
        if (textExtensions.includes(file.extension!)) return 'mdi-file-document';   
    }

    return 'mdi-file';
})
</script>
<template>
    <v-avatar :color="file.isFolder ? 'light-blue-accent-4' : 'blue-grey-darken-1'">
        <v-icon color="white">{{ icon }}</v-icon>
    </v-avatar>
</template>