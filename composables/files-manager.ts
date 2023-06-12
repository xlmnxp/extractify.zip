// class to load 7zip wasm module
// and extract files from archive

import * as Comlink from "comlink";
// @ts-expect-error typescript can't find it when query it with ?worker
import SevenZipWorker from "./worker/7zip-manager?worker";
import { SevenZipManager, iFile } from "./worker/7zip-manager";

export class FilesManager {
    consoleOutputBuffer: string[] = [];
    path: Ref<string> = useSelectedPath();
    remoteSevenZipManager?: Comlink.Remote<SevenZipManager>;

    constructor(private filesList: Ref<iFile[]>) {
        this.init();
    }

    async init() {
        this.remoteSevenZipManager = await new (Comlink.wrap(new SevenZipWorker()) as any);
    }

    async loadArchive(file: File) {
        if (!this.remoteSevenZipManager) return;
        this.filesList.value = await this.remoteSevenZipManager.loadArchive(file) || [];
    }

    getFile(path: string, innerList: iFile[] | undefined = undefined): any {
        if (path == "/") {
            return {
                content: this.filesList.value.sort((a:any, b:any) => {
                    // sort by folder and from a to z
                    if (a.isFolder && !b.isFolder) return -1;
                    if (!a.isFolder && b.isFolder) return 1;
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    return 0;
                }),
                isFolder: this.filesList.value.length ? true : false,
            };
        }

        for (const file of (innerList || this.filesList.value)) {
            if (file.path == path) {
                file.content = file.content?.sort((a:any, b:any) => {
                    // sort by folder and from a to z
                    if (a.isFolder && !b.isFolder) return -1;
                    if (!a.isFolder && b.isFolder) return 1;
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    return 0;
                });

                return file;
            }

            if (file.isFolder && path.includes(file.path)) {
                const recursiveFile = this.getFile(path, file.content);
                if (recursiveFile) {
                    return recursiveFile;
                }
            }
        }

        return undefined;
    }
}