<script setup lang="ts">
import { ref, watch, computed } from 'vue';

interface Props {
    modelValue: boolean;
    fileName: string;
    filePath: string;
    isFolder?: boolean;
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'rename', newName: string): void;
}

const props = withDefaults(defineProps<Props>(), {
    isFolder: false
});
const emit = defineEmits<Emits>();

const newName = ref('');
const isOpen = ref(props.modelValue);

// Computed property to ensure proper binding
const dialogOpen = computed({
    get: () => isOpen.value,
    set: (value) => {
        isOpen.value = value;
        emit('update:modelValue', value);
    }
});

watch(() => props.modelValue, (newValue) => {
    isOpen.value = newValue;
    if (newValue) {
        newName.value = props.fileName;
    }
}, { immediate: true });

watch(isOpen, (newValue) => {
    emit('update:modelValue', newValue);
});

function handleRename() {
    if (newName.value.trim() && newName.value !== props.fileName) {
        emit('rename', newName.value.trim());
        dialogOpen.value = false;
    }
}

function handleCancel() {
    dialogOpen.value = false;
}

function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
        handleRename();
    } else if (event.key === 'Escape') {
        handleCancel();
    }
}
</script>

<template>
    <v-dialog v-model="dialogOpen" max-width="400" persistent>
        <v-card>
            <v-card-title class="text-h6">
                Rename {{ isFolder ? 'Folder' : 'File' }}
            </v-card-title>
            
            <v-card-text>
                <v-text-field
                    v-model="newName"
                    label="New name"
                    :placeholder="fileName"
                    autofocus
                    @keydown="handleKeydown"
                    :rules="[
                        (v: string) => !!v || 'Name is required',
                        (v: string) => v.trim() !== '' || 'Name cannot be empty',
                        (v: string) => v !== fileName || 'Name must be different'
                    ]"
                />
            </v-card-text>
            
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    color="grey"
                    variant="text"
                    @click="handleCancel"
                >
                    Cancel
                </v-btn>
                <v-btn
                    color="primary"
                    variant="text"
                    @click="handleRename"
                    :disabled="!newName.trim() || newName.trim() === fileName"
                >
                    Rename
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
