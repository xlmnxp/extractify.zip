<script lang="ts" setup>
import '@vime/core/themes/default.css';
import { Player, DefaultUi, Video } from '@vime/vue-next';

import mime from 'mime';

interface Props {
    src: string
}

let { src } = defineProps<Props>();
let selectedPath = useSelectedPath();

let videoType = mime.getType(selectedPath.value);

</script>
<template>
    <Player playsinline style="width: 100%">
        <Video>
            <source :data-src="src" :type="videoType!" />
        </Video>
        <DefaultUi>
        </DefaultUi>
    </Player>
</template>