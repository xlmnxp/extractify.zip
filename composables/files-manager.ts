// class to load 7zip wasm module
// and extract files from archive

import * as Comlink from "comlink";
// @ts-expect-error typescript can't find it when query it with ?worker
import SevenZipWorker from "./worker/7zip-manager?worker";
import { SevenZipManager, iFile } from "./worker/7zip-manager";

export const videoExtensions = ['mp4', 'avi', 'mov', 'mkv'];
export const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
export const audioExtensions = ['mp3', 'wav', 'ogg', 'flac'];
export const textExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'js', 'ts', 'php', 'c', 'cpp', 'py', 'html', 'css', 'scss', 'sass', 'less', 'json', 'xml', 'sql', 'java', 'go', 'rb', 'sh', 'bat', 'ps1', 'cmd', 'yml', 'yaml', 'ini', 'toml', 'csv', 'tsv', 'gitignore', 'lock', 'htaccess', 'htpasswd', 'env', 'dockerfile', 'gitattributes', 'gitmodules', 'editorconfig', 'babelrc', 'eslintrc', 'eslintignore', 'prettierrc', 'prettierignore', 'stylelintrc', 'stylelintignore', 'postcssrc', 'postcss.config', 'jsx', 'tsx', 'license']

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
                content: this.filesList.value.sort((a: iFile, b: iFile) => {
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
                file.content = file.content?.sort((a: iFile, b: iFile) => {
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

    async getFileBlobUrl(path: string) {
        if (!this.remoteSevenZipManager) return;
        return await this.remoteSevenZipManager.generateBlobUrl(JSON.stringify(this.getFile(path)) as any);
    }

    async getFileContent(path: string) {
        if (!this.remoteSevenZipManager) return;
        return await this.remoteSevenZipManager.getFileContent(JSON.stringify(this.getFile(path)) as any);
    }
}