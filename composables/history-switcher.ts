// class to manage undo and redo history
export class HistorySwitcher {
    // path to the current file
    public path: Ref<String>
    // history of paths
    history: Ref<String[]>
    // index of the current path in the history
    index: Ref<number>

    public readonly hasUndo: ComputedRef<boolean> = computed(() => this.index.value !== 0);
    public readonly hasRedo: ComputedRef<boolean> = computed(() => this.index.value !== this.history.value.length - 1);
    
    // constructor
    constructor(path: Ref<String>) {
        this.path = path
        this.history = ref([path.value])
        this.index = ref(0);

        watchEffect(() => {
            this.add(path.value)
        })
    }

    // add a new path to the history
    add(path: String) {
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
}