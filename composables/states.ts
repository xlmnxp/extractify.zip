let selectedPath = ref("/")
export const useSelectedPath = () => useState("selected-path", () => selectedPath)