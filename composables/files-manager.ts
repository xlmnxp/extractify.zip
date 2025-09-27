// class to load 7zip wasm module
// and extract files from archive

import * as Comlink from "comlink";
// @ts-expect-error 7z-wasm have that file but typescript can't find it when query it with url
import SevenZipWorker from "./worker/7zip-manager?worker";
import { SevenZipManager, type iFile } from "./worker/7zip-manager";
import mime from 'mime';

export const videoExtensions = ['mp4', 'avi', 'mov', 'mkv'];
export const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
export const audioExtensions = ['mp3', 'wav', 'ogg', 'flac'];
export const textExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'js', 'ts', 'php', 'c', 'cpp', 'py', 'html', 'css', 'scss', 'sass', 'less', 'json', 'xml', 'sql', 'java', 'go', 'rb', 'sh', 'bat', 'ps1', 'cmd', 'yml', 'yaml', 'ini', 'toml', 'csv', 'tsv', 'gitignore', 'lock', 'htaccess', 'htpasswd', 'env', 'dockerfile', 'gitattributes', 'gitmodules', 'editorconfig', 'babelrc', 'eslintrc', 'eslintignore', 'prettierrc', 'prettierignore', 'stylelintrc', 'stylelintignore', 'postcssrc', 'postcss.config', 'jsx', 'tsx', 'license'];
export const binaryExtensions = ['exe', 'dll', 'so', 'dylib', 'bin', 'dat', 'db', 'sqlite', 'o', 'class', 'pyc', 'jar'];
export const supportedExtensions = [
    '7z', 'xz', 'bz2', 'gz', 'tar', 'zip', 'wim',
    'apfs', 'ar', 'arj', 'cab', 'chm', 'cpio', 'dmg', 'ext', 'fat', 'gpt', 'hfs',
    'ihex', 'iso', 'lzh', 'lzma', 'mbr', 'msi', 'nsis', 'ntfs', 'qcow2', 'rar',
    'rpm', 'squashfs', 'udf', 'uefi', 'vdi', 'vhd', 'vhdx', 'vmdk', 'xar', 'z', 'jar'
];

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
        
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !supportedExtensions.includes(extension)) {
            throw new Error('Unsupported file format. Please use a supported archive format.');
        }

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

    async getFileContent(path: string, encoding: "utf8" | "binary" = "utf8") {
        if (!this.remoteSevenZipManager) return;
        return await this.remoteSevenZipManager.getFileContent(JSON.stringify(this.getFile(path)) as any, encoding);
    }

    async downloadFile(path: string) {
        if (!this.remoteSevenZipManager) return;

        const file = this.getFile(path);
        const fileContent = await this.getFileContent(path, "binary");
        if (!file) return;

        const blob = new Blob([fileContent as any], { type: mime.getType(file.extension!) || "application/octet-stream" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        
    }

    async renameFile(path: string, newName: string) {
        if (!this.remoteSevenZipManager) return false;
        
        try {
            const success = await this.remoteSevenZipManager.renameFile(path, newName);
            if (success) {
                // Update the file structure in memory
                this.updateFileInStructure(path, newName);
            }
            return success;
        } catch (error) {
            console.error('Error renaming file:', error);
            return false;
        }
    }

    private updateFileInStructure(oldPath: string, newName: string) {
        const updateFileRecursive = (files: iFile[]): boolean => {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.path === oldPath) {
                    // Update the file name and path
                    const pathParts = oldPath.split('/');
                    pathParts.pop();
                    const directoryPath = pathParts.join('/') || '/';
                    const newPath = directoryPath === '/' ? `/${newName}` : `${directoryPath}/${newName}`;
                    
                    file.name = newName;
                    file.path = newPath;
                    return true;
                }
                if (file.isFolder && file.content && updateFileRecursive(file.content)) {
                    return true;
                }
            }
            return false;
        };

        updateFileRecursive(this.filesList.value);
    }
}