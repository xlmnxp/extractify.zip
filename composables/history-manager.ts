import { FilesManager } from "./files-manager";

// class to manage undo and redo history
export class HistoryManager {
    // path to the current file
    private path: Ref<string> = useSelectedPath();

    // history of paths
    history: Ref<string[]>
    // index of the current path in the history
    index: Ref<number>


    public readonly hasUndo: ComputedRef<boolean> = computed(() => this.index.value !== 0);
    public readonly hasRedo: ComputedRef<boolean> = computed(() => this.index.value !== this.history.value.length - 1);
    
    // constructor
    constructor(private filesManager: FilesManager) {
        this.history = ref([this.path.value])
        this.index = ref(0);

        watchEffect(() => {
            if(this.filesManager.getFile(this.path.value)) {
                this.add(this.path.value)
            }
        })
    }

    // add a new path to the history
    add(path: string) {
        // if the path is the same as the previous path, do nothing
        if (path === this.history.value[this.index.value]) return

        // if the path is the same as the last path in the history, do nothing
        if (path === this.history.value[this.history.value.length - 1]) return
        // if the index is not at the end of the history, remove all paths after the index
        if (this.index.value !== this.history.value.length - 1) {
            this.history.value.splice(this.index.value + 1)
        }
        // add the path to the history
        this.history.value.push(path)
        // move the index forward one
        this.index.value++
    }

    // undo the last action
    undo() {
        // if the index is 0, do nothing
        if (this.index.value === 0) return
        // move the index back one
        this.index.value--
        // set the path to the path at the index
        this.path.value = this.history.value[this.index.value]
    }

    // can undo the last action
    canUndo() {
        // return true if the index is not 0
        return this.index.value !== 0
    }
    
    // redo the last action
    redo() {
        // if the index is at the end of the history, do nothing
        if (this.index.value === this.history.value.length - 1) return
        // move the index forward one
        this.index.value++
        // set the path to the path at the index
        this.path.value = this.history.value[this.index.value]
    }

    canRedo() {
        // return true if the index is not at the end of the history
        return this.index.value !== this.history.value.length - 1
    }

    refresh() {
        this.path.value = this.history.value[this.index.value]
    }

    reset() {
        this.history.value = [this.path.value]
        this.index.value = 0
    }
}