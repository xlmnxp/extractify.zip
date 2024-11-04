<script lang="ts" setup>
import { getElementInfo } from "moveable";
import { VueSelecto } from "vue3-selecto";
import { FilesManager } from '~/composables/files-manager';
import { iFile } from '~/composables/worker/7zip-manager';

interface Props {
    filesManager: FilesManager;
    filesGridList: iFile[];
    selectedList: Ref<string[]>
};

const { filesManager, filesGridList, selectedList } = defineProps<Props>();

const selectedPath = useSelectedPath();

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

watchEffect(() => {
    selectedList.value = [];
    for (const selectedElement of document.querySelectorAll(".selectable.selected")) {
        selectedElement.classList.remove("selected");
    }
})
</script>

<template>
    <v-list class="select-area" :selected="[selectedPath]" style="height: calc(100vh - 120px);">
        <v-row no-gutters>
            <v-col cols="6" lg="2" md="3" sm="6" v-for="file of filesGridList" style="text-align: center;">
                <v-list-item class="position-relative ma-2 pa-5 selectable" active-color="light-blue-darken-4"
                    :value="file.path" rounded @click="selectedPath = file.path">
                    <v-menu v-if="!file.isFolder">
                        <template v-slot:activator="{ props }">
                            <v-btn class="position-absolute" style="right: 0; top: 0;" icon="mdi-dots-vertical"
                                variant="text" v-bind="props"></v-btn>
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
        <VueSelecto :selectableTargets="['.selectable']" :dragContainer="dragContainer" :hitRate="0"
        :selectFromInside="false" :toggleContinueSelect="'ctrl'" @select="onSelectStart" @selectStart="onSelectStart"
        :get-element-rect="getElementInfo" @selectEnd="onSelectEnd" :select-by-click="false" />
    </v-list>
</template>