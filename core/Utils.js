const FsExtra = require("fs-extra");
const Path = require("path");
const package = require("../package.json");
const packageName = package.name;

/**@type {{path:string,id:string,name:string}} */
const projectInfo = Editor.Project;

module.exports = {
    getProjectInfo() {
        return projectInfo;
    },
    /**获取包信息
     * @returns {typeof package} */
    getPackageInfo() { return package },
    getPanelID(id) {
        let panelID = packageName;
        if (id) {
            panelID += "." + id;
        }
        return panelID;
    },
    /**界面是否打开
     * @param {string} id */
    panelIsOpen(id) {
        return Editor.Panel.findWindow(this.getPanelID(id));
    },
    /**打开界面
     * @param {string} id */
    openPanel(id) {
        return Editor.Panel.open(this.getPanelID(id));
    },



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
    success() {
        Editor.success.apply(Editor, [`${packageName}::`, ...arguments]);
    },
    /**
     * 递归读取目录 返回绝对路径
     * @param {string} dir
     * @param {boolean} isDir 返回数据中是否包含目录 默认:false
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
    },

    /**
     * 删除一个目录
     * @param {string} dir 
     * @param {boolean} removeSelf 是否删除自己 默认false 
     */
    rmdirsSync(dir, removeSelf) {
        if (FsExtra.existsSync(dir) == false) {
            return;
        }

        let files = FsExtra.readdirSync(dir);
        files.forEach((file) => {
            var curPath = path.join(dir, file);
            if (FsExtra.statSync(curPath).isDirectory()) { // 递归
                this._rmdirSync(curPath, true);
            } else { // 删除文件
                FsExtra.unlinkSync(curPath);
            }
        });

        if (removeSelf === true) {
            FsExtra.rmdirSync(dir);
        }
    },

    clearDir(dir) {
        this._rmdirSync(dir);
    }


}