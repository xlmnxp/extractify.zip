import { FilesManager } from "./files-manager";

let selectedPath = ref("/")
export const useSelectedPath = () => useState("selected-path", () => selectedPath)