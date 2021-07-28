const FsExtra = require("fs-extra");
const Path = require("path");
const AssetDB = require("../core/AssetDB");
const IPC = require("../core/IPC");
const { Manifest } = require("../core/ManifestBuilder");
const ManifestBuilder = require("../core/ManifestBuilder");
const Utils = require("../core/Utils");

const inject_script = `
(function () {
    if (typeof window.jsb === 'object') {
        var hotUpdateSearchPaths = localStorage.getItem('HotUpdateSearchPaths');
        if (hotUpdateSearchPaths) {
            var paths = JSON.parse(hotUpdateSearchPaths);
            jsb.fileUtils.setSearchPaths(paths);

            var fileList = [];
            var storagePath = paths[0] || '';
            var tempPath = storagePath + '_temp/';
            var baseOffset = tempPath.length;

            if (jsb.fileUtils.isDirectoryExist(tempPath) && !jsb.fileUtils.isFileExist(tempPath + 'project.manifest.temp')) {
                jsb.fileUtils.listFilesRecursively(tempPath, fileList);
                fileList.forEach(srcPath => {
                    var relativePath = srcPath.substr(baseOffset);
                    var dstPath = storagePath + relativePath;

                    if (srcPath[srcPath.length] == '/') {
                        cc.fileUtils.createDirectory(dstPath)
                    }
                    else {
                        if (cc.fileUtils.isFileExist(dstPath)) {
                            cc.fileUtils.removeFile(dstPath)
                        }
                        cc.fileUtils.renameFile(srcPath, dstPath);
                    }
                })
                cc.fileUtils.removeDirectory(tempPath);
            }
        }
    }
})();
`



module.exports = {
    /**重构 main.js */
    reWriteMainJs(options) {
        let buildDest = options.dest;
        buildDest = Path.normalize(buildDest);
        let url = Path.join(buildDest, "main.js");
        let data = FsExtra.readFileSync(url, "utf8");
        // Utils.log(data);
        if (data && typeof data === "string") {
            var newData = inject_script + data;
            FsExtra.writeFileSync(url, newData, "utf8");
            Utils.log("HotUpdateSearchPaths 已插入 main.js 文件头部");
        }
    },

    async build(options) {
        if (!Utils.panelIsOpen("03")) {
            return;
        }
        // MD5Cache 勾选校验
        if (options.md5Cache === true) {
            Utils.error("当前热更插件未支持 md5Cache 选项");
            return;
        }
        Utils.success("==========热更编译开始==========");
        let buildDest = options.dest;
        let platform = options.platform;  // 'android',
        // 获取热更面板配置数据
        let [err, hotConfig] = await IPC.sendToPanel("03", "onBuildFinished", null);
        if (err) {
            return;
        }
        let {
            version,
            packageUrl,
            isPackageUrlAddVersion,
            saveDir,
            isZipImport,
            isZipNative,
        } = this.processPanelConfig(hotConfig);

        Utils.log("热更服务器: " + packageUrl);
        // 1.拷贝热更文件到指定目录
        let copyDest = saveDir;
        // 生成目录
        let dirs = ManifestBuilder.copyManifestPaths(buildDest, copyDest);
        // 压缩目录
        await ManifestBuilder.zipDir(copyDest, isZipImport, isZipNative);

        // 2.编译热更文件
        let manifest = new Manifest(version, packageUrl);
        ManifestBuilder.buildManifest(copyDest, manifest);
        // 3.热更清单写入热更目录
        ManifestBuilder.writeManifest(copyDest, manifest);
        // 4.热更清单写入项目目录
        let [file1, file2] = ManifestBuilder.writeManifest(AssetDB.urlToFspath("db://assets"), manifest);
        // 刷新资源
        AssetDB.refreshByPath(file1);
        AssetDB.refreshByPath(file2);

        // 5.重构 main.js
        this.reWriteMainJs(options);
        Utils.log(`已生成热更信息 => .../${Utils.relativeProject(copyDest)}`);
        Utils.success("==========热更编译完成==========");
    },

    /**处理热更面板配置 */
    processPanelConfig(hotConfig) {
        // saveDir 转绝对路径
        hotConfig.saveDir = Path.join(Utils.getProjectInfo().path, hotConfig.saveDir || "");
        // 处理 packageUrl 
        if (hotConfig.isPackageUrlAddVersion == true) {
            hotConfig.saveDir = Path.join(hotConfig.saveDir, hotConfig.version);
            hotConfig.packageUrl = Utils.httpUrlJoin(hotConfig.packageUrl, hotConfig.version);
        }


        return hotConfig;
    },



}