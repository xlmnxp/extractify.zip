// class to load 7zip wasm module
// and extract files from archive

import SevenZip, { type SevenZipModule } from "7z-wasm";
import SevenZipWasm from "7z-wasm/7zz.wasm?url";
import * as Comlink from "comlink";
import { v4 as randomUUID } from "uuid";
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
    originalName: string = "";

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

        this.originalName = file.name;
        this.archiveName = `/${file.name}`;

        const stream = this.sevenZip.FS.open(this.archiveName, "w+");
        let archiveData = new Uint8Array(await file.arrayBuffer());

        this.sevenZip.FS.write(stream, archiveData, 0, archiveData.byteLength);
        this.sevenZip.FS.close(stream);

        // workaround to support tar.gz and tar.xz formats
        if ([".tar.gz", ".tgz", ".tar.xz"].some(ext => this.archiveName.endsWith(ext))) {
            this.archiveName = randomUUID();
            this.execute(["x", "-y", this.originalName, `-o${this.archiveName}`]);
        }

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

        const blob = new Blob([new Uint8Array(buffer)], { type: mime.getType(file.extension!) || "application/octet-stream" });
        const blobUrl = URL.createObjectURL(blob);

        // remove the file after extract local blob url
        this.sevenZip.FS.unlink(file.path);

        return blobUrl;
    }

    // get content from buffer (Experimental)
    async getFileContent(file: iFile, encoding: "utf8" | "binary" = "utf8") {
        if (!this.sevenZip) return;
        file = typeof file === "string" ? JSON.parse(file) : file;
        if (!file) return;

        // extract file from archive
        this.execute(['x', '-y', this.archiveName, file?.path.substring(1)]);
        this.sevenZip.FS.chmod(file.path, 0o777);

        // get file buffer
        const buffer = this.sevenZip.FS.readFile(file.path, { encoding: encoding as any });
        // remove the file after extract local blob url
        this.sevenZip.FS.unlink(file.path);

        return buffer;
    }

    // rename file in archive
    async renameFile(oldPath: string, newName: string) {
        if (!this.sevenZip) return false;
        
        try {
            // Get the directory path for the new file
            const pathParts = oldPath.split('/');
            pathParts.pop(); // Remove the old filename
            const directoryPath = pathParts.join('/') || '/';
            const newPath = directoryPath === '/' ? `/${newName}` : `${directoryPath}/${newName}`;
            
            // Extract the file to a temporary location
            const tempPath = oldPath.substring(1);
            this.execute(['x', '-y', this.archiveName, tempPath]);
            
            // Read the file content
            const fileContent = this.sevenZip.FS.readFile(tempPath);
            
            // Create the new file with the new name
            const newTempPath = newPath.substring(1);
            const newFileStream = this.sevenZip.FS.open(newTempPath, "w+");
            this.sevenZip.FS.write(newFileStream, fileContent, 0, fileContent.byteLength);
            this.sevenZip.FS.close(newFileStream);

            // Remove the old file from the archive
            this.execute(['d', this.archiveName, tempPath]);
            
            // Add the new file to the archive
            this.execute(['a', this.archiveName, newTempPath]);
            
            // Clean up the temporary files
            this.sevenZip.FS.unlink(tempPath);
            this.sevenZip.FS.unlink(newTempPath);
            
            return true;
        } catch (error) {
            console.error('Error renaming file:', error);
            return false;
        }
    }

    // create archive from selected files
    async createArchiveFromFiles(filePaths: string[], archiveName: string, _format: string = 'zip') {
        if (!this.sevenZip) return false;
        
        let tempDir: string | null = null;
        
        try {
            // Create a new archive
            const newArchivePath = `/${archiveName}`;
            
            // Extract all selected files to temporary directory
            tempDir = `/temp_${randomUUID()}`;
            this.sevenZip.FS.mkdir(tempDir, 0o777);
            
            for (const filePath of filePaths) {
                const tempPath = filePath.substring(1); // Remove leading slash
                try {
                    this.execute(['x', '-y', this.archiveName, tempPath, `-o${tempDir}`]);
                } catch (extractError) {
                    console.warn(`Warning: Could not extract ${tempPath}:`, extractError);
                }
            }

            // loop through all files in temp directory and set the permission to 777
            try {
                const files = this.sevenZip.FS.readdir(tempDir);
                for (const file of files) {
                    const fullPath = `${tempDir}/${file}`;
                    try {
                        this.sevenZip.FS.chmod(fullPath, 0o777);
                    } catch (chmodError) {
                        console.warn(`Warning: Could not set permissions for ${fullPath}:`, chmodError);
                    }
                }
            } catch (readdirError) {
                console.warn(`Warning: Could not read temp directory ${tempDir}:`, readdirError);
            }

            // Create new archive with extracted files using the specified format
            this.sevenZip.FS.chdir(tempDir);
            
            this.execute(['a', newArchivePath, `*`]);

            this.sevenZip.FS.chdir('/');
            
            return true;
        } catch (error) {
            console.error('Error creating archive:', error);
            return false;
        } finally {
            // Always try to clean up temporary directory, even if there was an error
            if (tempDir) {
                try {
                    this.cleanupDirectory(tempDir);
                } catch (cleanupError) {
                    console.warn(`Warning: Could not clean up temp directory ${tempDir}:`, cleanupError);
                }
            }
        }
    }

    // get archive blob for download
    async getArchiveBlob(archiveName: string) {
        if (!this.sevenZip) return null;
        
        try {
            const buffer = this.sevenZip.FS.readFile(`/${archiveName}`);
            
            // Determine MIME type based on file extension
            const extension = archiveName.split('.').pop()?.toLowerCase();
            let mimeType = 'application/zip'; // default
            
            switch (extension) {
                case '7z':
                    mimeType = 'application/x-7z-compressed';
                    break;
                case 'tar':
                    mimeType = 'application/x-tar';
                    break;
                case 'zip':
                default:
                    mimeType = 'application/zip';
                    break;
            }
            
            const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
            
            // Clean up the temporary archive
            this.sevenZip.FS.unlink(`/${archiveName}`);
            
            return blob;
        } catch (error) {
            console.error('Error getting archive blob:', error);
            return null;
        }
    }

    // helper method to clean up directory recursively
    private cleanupDirectory(dirPath: string) {
        if (!this.sevenZip) return;
        try {
            // Check if directory exists first
            const stat = this.sevenZip.FS.stat(dirPath);
            if (!stat || !(stat as any).isDirectory || !(stat as any).isDirectory()) {
                return; // Directory doesn't exist or is not a directory
            }

            const files = this.sevenZip.FS.readdir(dirPath);
            
            // First, recursively clean up all subdirectories and files
            for (const file of files) {
                const fullPath = `${dirPath}/${file}`;
                try {
                    const fileStat = this.sevenZip.FS.stat(fullPath);
                    if (fileStat && (fileStat as any).isDirectory && (fileStat as any).isDirectory()) {
                        // Recursively clean up subdirectory
                        this.cleanupDirectory(fullPath);
                    } else {
                        // Remove file
                        this.sevenZip.FS.unlink(fullPath);
                    }
                } catch (fileError) {
                    console.warn(`Warning: Could not process ${fullPath}:`, fileError);
                }
            }
            
            // Now try to remove the directory itself
            try {
                this.sevenZip.FS.rmdir(dirPath);
            } catch (rmdirError) {
                // If rmdir fails, try to force remove if it's empty
                try {
                    const remainingFiles = this.sevenZip.FS.readdir(dirPath);
                    if (remainingFiles.length === 0) {
                        this.sevenZip.FS.rmdir(dirPath);
                    } else {
                        console.warn(`Directory ${dirPath} still contains files:`, remainingFiles);
                    }
                } catch (finalError) {
                    console.warn(`Could not remove directory ${dirPath}:`, finalError);
                }
            }
        } catch (error) {
            console.error('Error cleaning up directory:', error);
        }
    }
}

Comlink.expose(SevenZipManager);