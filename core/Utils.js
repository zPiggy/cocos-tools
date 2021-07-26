const FsExtra = require("fs-extra");
const Path = require("path");
const package = require("../package.json");
const packageName = package.name;

/**@type {{path:string,id:string,name:string}} */
const projectInfo = Editor.Project;
/**http地址头部匹配 */
const HTTP_TEST = new RegExp(/^https?:\/\//);
const UNIT_BYTE = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

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
            var curPath = Path.join(dir, file);
            if (FsExtra.statSync(curPath).isDirectory()) { // 递归
                this.rmdirsSync(curPath, true);
            } else { // 删除文件
                FsExtra.unlinkSync(curPath);
            }
        });

        if (removeSelf === true) {
            FsExtra.rmdirSync(dir);
        }
    },

    clearDir(dir) {
        this.rmdirsSync(dir);
    },


    /**
     * 转为项目相对路径
     * @param {string} url 绝对路径
     * @returns 
     */
    relativeProject(url) {
        return Path.relative(this.getProjectInfo().path, url);
    },

    /**
     * 项目相对路径转绝对路径
     * @param {string} url 
     */
    absolutePath(url) {
        if (url.startsWith('/')) {
            return url;
        }
        return Path.join(this.getProjectInfo().path, url);
    },

    /**
     * 
     * @param {string} httpUrl 
     * @param  {string[]} args 
     */
    httpUrlJoin(httpUrl, ...args) {
        // 取出 https?:// 头部
        let result = HTTP_TEST.exec(httpUrl);
        if (!result) {
            throw new Error("不是一个完整的网络地址 " + httpUrl);
        }
        let http = result[0];
        let host = httpUrl.replace(http, "");
        args.unshift(host);
        let newUrl = Path.join.apply(Path, args);
        return http + newUrl;
    },

    byteConvert(bytes) {
        var unit = UNIT_BYTE;
        if (!bytes || isNaN(bytes)) {
            return "0 " + unit[0];
        }
        var exp = Math.floor(Math.log(bytes) / Math.log(2));
        if (exp < 1) {
            exp = 0;
        }
        var i = Math.floor(exp / 10);
        bytes = bytes / Math.pow(2, 10 * i);

        if (bytes.toString().length > bytes.toFixed(2).toString().length) {
            bytes = bytes.toFixed(2);
        }
        return bytes + ' ' + unit[i];
    },
}