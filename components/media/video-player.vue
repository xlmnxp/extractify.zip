<script lang="ts" setup>
import 'vue-plyr/dist/vue-plyr.css';
// @ts-ignore
import VuePlyr from 'vue-plyr';
import mime from 'mime';

interface Props {
    src: string
}

let { src } = defineProps<Props>();
let selectedPath = useSelectedPath();

let videoType = mime.getType(selectedPath.value);
</script>
<template>
    <VuePlyr>
        <video controls playsinline :src="src" :type="videoType!" style="height: 84vh;">
        </video>
    </VuePlyr>
</template>