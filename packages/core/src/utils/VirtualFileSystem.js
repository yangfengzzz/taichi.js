export class VirtualFileSystem {
    /**
     * Writes a file in the virtual FS
     * @param filename The path this file should be stored as
     * @param content The contents of the file
     * @param overwrite If existing files should be overwritten
     */
    writeFile(filename, content, overwrite = false) {
        //log("vfs", `writeFile(filename: "${filename}", content: length ${content ? content.length : 0}, overwrite: ${overwrite}`, "debug");
        const exists = this.fileExists(filename, true);
        if (!overwrite && exists) {
            throw new Error(`The file ${filename} already exists. Set overwrite to true if you want to override it`);
        }
        if (!exists) {
            //log("vfs", "  creating new file with version 1", "debug");
            this.files[filename] = {
                version: 1,
                content
            };
        }
        else if (this.files[filename].content !== content) {
            this.files[filename] = {
                version: this.files[filename].version + 1,
                content
            };
            //log("vfs", `  updating file => version ${this.files[filename].version}`, "debug");
        }
    }
    /**
     * Checks if a file exists in the virtual FS
     * @param filename The path of the file to look for
     */
    fileExists(filename, suppressLog = false) {
        const ret = filename in this.files;
        return ret;
    }
    /**
     * Deletes a file in the virtual FS. If the file doesn't exist, nothing happens.
     * @param filename The path of the file to look for
     */
    deleteFile(filename) {
        //log("vfs", `deleteFile("${filename}")`, "debug");
        if (this.fileExists(filename, true))
            delete this.files[filename];
    }
    /**
     * Reads a file's contents from the virtual FS
     * @param filename The path of the file to look for
     */
    readFile(filename) {
        if (!this.fileExists(filename, true)) {
            throw new Error(`The file ${filename} doesn't exist`);
        }
        const ret = this.files[filename].content;
        //log("vfs", `readFile("${filename}") => length ${ret ? ret.length : 0}`, "debug");
        return ret;
    }
    /**
     * Returns the revision number of a file in the virtual FS
     * @param filename The path of the file to look for
     */
    getFileVersion(filename) {
        if (!this.fileExists(filename, true)) {
            throw new Error(`The file ${filename} doesn't exist`);
        }
        const ret = this.files[filename].version;
        //log("vfs", `getFileVersion("${filename}") => ${ret}`, "debug");
        return ret;
    }
    /**
     * Returns the file names of all files in the virtual fs
     */
    getFilenames() {
        //log("vfs", `getFilenames()`, "debug");
        return Object.keys(this.files);
    }
    getDirectories(root) {
        //log("vfs", `fs.getDirectories(${root})`, "debug");
        let paths = this.getFilenames();
        //log("vfs", `fs.getDirectories => paths = ${paths}`, "debug");
        paths = paths.filter((p) => p.startsWith(root));
        //log("vfs", `fs.getDirectories => paths = ${paths}`, "debug");
        paths = paths.map((p) => p.substr(root.length + 1).split("/")[0]);
        //log("vfs", `fs.getDirectories => paths = ${paths}`, "debug");
        return paths;
    }
    files = {};
}
