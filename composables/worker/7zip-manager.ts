// class to load 7zip wasm module
// and extract files from archive

import SevenZip, { SevenZipModule } from "7z-wasm";
// @ts-expect-error 7z-wasm have that file but typescript can't find it when query it with url
import SevenZipWasm from "7z-wasm/7zz.wasm?url";
import * as Comlink from "comlink";
import mime from 'mime';

export interface iFile {
    name: string;
    path: string;
    isFolder: boolean;
    toggle: boolean;
    extension?: string;
    content?: iFile[];
}

export class SevenZipManager {
    sevenZip?: SevenZipModule;
    consoleOutputBuffer: string[] = [];
    archiveName: string = "";

    constructor() {
        this.init();
    }

    async init() {
        this.sevenZip = await SevenZip({
            locateFile: () => SevenZipWasm,
            print: (text) => {
                if (text.lastIndexOf("\b")) {
                    text = text.substring(text.lastIndexOf("\b") + 1);
                }
                this.consoleOutputBuffer.push(text);
            },
        });
    }

    execute(commands: string[]) {
        if (!this.sevenZip) return;
        this.consoleOutputBuffer = [];
        this.sevenZip.callMain(commands);
        return this.consoleOutputBuffer;
    }

    async loadArchive(file: File) {
        if (!this.sevenZip) return;

        this.archiveName = file.name;

        const stream = this.sevenZip.FS.open(this.archiveName, "w+");
        let archiveData = new Uint8Array(await file.arrayBuffer());

        this.sevenZip.FS.write(stream, archiveData, 0, archiveData.byteLength);
        this.sevenZip.FS.close(stream);

        // 7zip get files list
        let filesString = this.execute(["l", "-ba", this.archiveName]);

        // parse files list
        let unorganizedFiles = filesString!.map((fileString) => {
            let file: RegExpMatchArray = /[\s+|(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})]\s+(?<type>[AD.]+)\s+(?<size>\d+)\s+(?<compressed>\d+)\s+(?<path>.+)[\n\r]{0,}/.exec(fileString)!;
            let isFolder = file.groups!.type?.indexOf("D") > -1 ? true : false;
            return {
                name: file.groups!.path.lastIndexOf('/') > -1 ? file.groups!.path.substring(file.groups!.path.lastIndexOf('/') + 1) : file.groups!.path,
                path: `/${file.groups!.path}`,
                isFolder: isFolder ? true : false,
                extension: isFolder ? "" : file.groups!.path.substring(file.groups!.path.lastIndexOf('.') + 1).toLowerCase(),
                content: isFolder ? [] as any[] : undefined,
            }
        });

        // sort unorganized files by depth
        unorganizedFiles = unorganizedFiles.sort((a, b) => {
            const aPathArrayLength = (a.path.match(/\//g) || []).length;
            const bPathArrayLength = (b.path.match(/\//g) || []).length;
            if (aPathArrayLength > bPathArrayLength) return -1;
            if (aPathArrayLength < bPathArrayLength) return 1;
            return 0;
        });

        // sort files and folder inside each folder
        const pathArrays: any = {};
        for (let file of unorganizedFiles) {
            // get parent folder file
            const parentPath = file.path.substring(0, file.path.lastIndexOf("/"));
            let parentFolderFile = pathArrays[parentPath] || unorganizedFiles.find(_file => _file.path === parentPath);
            if (!parentFolderFile) {
                unorganizedFiles.push({
                    name: parentPath.substring(parentPath.lastIndexOf('/') + 1),
                    path: parentPath,
                    isFolder: true,
                    extension: "",
                    content: [],
                });

                parentFolderFile = unorganizedFiles.find(_file => _file.path === parentPath);
            };

            // add file to parent folder content
            if (!parentFolderFile.content) parentFolderFile.content = [];
            parentFolderFile.content.push(file);

            // cache split path array to avoid calling split() multiple times
            const pathArray = pathArrays[file.path] || file.path.split("/");
            pathArrays[file.path] = pathArray;
        }

        // remove folders from root
        const files = unorganizedFiles.filter(file => (file.path.match(/\//g) || []).length == 1).sort((a: any, b: any) => {
            // sort by folder and from a to z
            if (a.isFolder && !b.isFolder) return -1;
            if (!a.isFolder && b.isFolder) return 1;
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });

        return files as iFile[];
    }

    // wait until console output is empty
    async waitConsoleOutput() {
        if (!this.sevenZip) return;

        let breakLoop = false;
        let lastLength = this.consoleOutputBuffer.length;
        while (!breakLoop) {
            await new Promise((resolve) => {
                if (lastLength == this.consoleOutputBuffer.length) {
                    breakLoop = true;
                    return;
                }

                lastLength = this.consoleOutputBuffer.length;
                setTimeout(resolve, 10)
            });
        }

        return;
    }

    // generate blob url from buffer (Experimental)
    async generateBlobUrl(file: iFile) {
        if (!this.sevenZip) return;
        file = typeof file === "string" ? JSON.parse(file) : file;

        // extract file from archive
        this.execute(['x', '-y', this.archiveName, file.path.substring(1)]);
        this.sevenZip.FS.chmod(file.path, 0o777);

        // get file buffer
        const buffer = this.sevenZip.FS.readFile(file.path);

        const blob = new Blob([buffer], { type: mime.getType(file.extension!) || "application/octet-stream" });
        const blobUrl = URL.createObjectURL(blob);

        // remove the file after extract local blob url
        this.sevenZip.FS.unlink(file.path);

        return blobUrl;
    }

    // get content from buffer (Experimental)
    async getFileContent(file: iFile) {
        if (!this.sevenZip) return;
        file = typeof file === "string" ? JSON.parse(file) : file;

        // extract file from archive
        this.execute(['x', '-y', this.archiveName, file.path.substring(1)]);
        this.sevenZip.FS.chmod(file.path, 0o777);

        // get file buffer
        const buffer = this.sevenZip.FS.readFile(file.path, { encoding: "utf8" });
        // remove the file after extract local blob url
        this.sevenZip.FS.unlink(file.path);

        return buffer;
    }
}

Comlink.expose(SevenZipManager);