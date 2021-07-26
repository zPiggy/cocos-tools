const FsExtra = require("fs-extra");
const Path = require("path");
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
        if (Utils.panelIsOpen("03") == false) {
            Utils.log(2);
            return;
        }
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
        } = hotConfig;
        Utils.log(hotConfig);
        Utils.log(version, packageUrl);
        let manifest = new Manifest(version, packageUrl);
        // 拷贝文件到指定目录
        let destDir = Path.join(Utils.getPackageInfo().path, saveDir);
        ManifestBuilder.copyManifestPaths(buildDest, destDir);





        // 重构 main.js
        this.reWriteMainJs(options);
    }


}