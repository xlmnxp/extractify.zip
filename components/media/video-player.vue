<script lang="ts" setup>
import 'vue-plyr/dist/vue-plyr.css';
// @ts-ignore
import VuePlyr from 'vue-plyr';

interface Props {
    src: string
}

let { src } = defineProps<Props>();
</script>
<template>
    <VuePlyr>
        <video controls playsinline>
            <source :src="src" />
        </video>
    </VuePlyr>
</template>