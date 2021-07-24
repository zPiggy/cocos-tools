const FsExtra = require("fs-extra");
const Path = require("path");
const package = require("../package.json");
const packageName = package.name;


module.exports = {
    /**获取包信息
     * @returns {typeof package} */
    getPackageInfo() { return package },
    error() {
        Editor.error.apply(Editor, [`${packageName}::`, ...arguments]);
    },
    warn() {
        // Editor.warn(`${packageName}::`, error);
        Editor.warn.apply(Editor, [`${packageName}::`, ...arguments]);
    },
    log() {
        // Editor.log(`${packageName}::`, error);
        Editor.log.apply(Editor, [`${packageName}::`, ...arguments]);
    },
    /**
     * 递归读取目录 返回绝对路径
     * @param {string} dir
     * @param {boolean} isDir 返回数据中是否包含目录
     * @returns {string[]}
     */
    readDirs(dir, isDir = false, ret = []) {
        let files = ret || [];
        let results = FsExtra.readdirSync(dir);
        results.forEach(file => {
            if (file === "." || file === "..") { return; }

            let url = Path.join(dir, file);
            let stat = FsExtra.statSync(url)
            // 递归目录
            if (stat.isDirectory()) {
                isDir && files.push(url);   // 存入目录
                this.readDirs(url, isDir, files);
            }
            else if (stat.isFile()) {
                files.push(url);            // 存入文件
            }
        })

        return files;
    }



}