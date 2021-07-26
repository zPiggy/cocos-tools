//
// CocosCreator 热更打包模块
//
const FsExtra = require("fs-extra");
const Path = require("path");
const Utils = require("./Utils");
const Jszip = require('jszip');
const Crypto = require("crypto");


const PROJECT_FILE_NAME = "preject.manifest";
const VERSION_FILE_NAME = "version.manifest";
/**需要热更的目录 */
const manifestPaths = ["src", "jsb-adapter", "assets"];


var ZIP_COMMON_DATE = new Date("2020-01-01");  // zip压缩时采用的公共文件修改时间

/**
 * 生成文件清单对象
 * @param {string} version 
 * @param {string} packageUrl 
 */
function Manifest(version, packageUrl) {
    this.version = version.trim();
    packageUrl = packageUrl.trim();     // 首尾空格
    if (packageUrl.endsWith("/")) {     // 尾部 '/'
        packageUrl.substr(0, packageUrl.length - 1);
    }
    //
    // "http://host" 会被 path.join 转成  "http:/host"
    //
    this.packageUrl = packageUrl;
    this.remoteVersionUrl = packageUrl + "/" + VERSION_FILE_NAME;
    this.remoteManifestUrl = packageUrl + "/" + PROJECT_FILE_NAME;
    this.assets;
}

/**热更清单文件编译器 */
module.exports = {
    /**生成一个空的manifest文件 */
    Manifest,

    /**
     * 将dir变成场Manifest对象
     * @param {string} dirs 绝对路径数组
     * @param {Manifest} manifest
     */
    buildManifest(dirs, manifest) {
        manifest.assets = manifest.assets || {};
        // 依次编译热更目录
        dirs.forEach((dir) => {
            this.buildDir(dir, manifest.assets);
        });
    },

    buildDir(dir, assets) {
        assets = assets || {};
        try {
            if (!FsExtra.existsSync(dir)) {
                throw new Error(`热更目录不存在 ${url}`);
            }
            // 读取所有文件(绝对路径)
            let files = Utils.readDirs(url);
            files.forEach((file) => {
                let stat = FsExtra.statSync(file);
                if (stat.isFile() == false) {
                    return;
                }
                size = stat.size;
                // 编译 MD5
                md5 = Crypto.createHash('md5').update(FsExtra.readFileSync(file, 'binary')).digest('hex');
                compressed = Path.extname(file).toLowerCase() === '.zip';
                // 获取相对路径
                let relative = Path.relative(root, file);
                relative = relative.replace(/\\/g, '/');    // 目录分隔符转成 '/'
                relative = encodeURI(relative);

                assets[relative] = {
                    'size': size,
                    'md5': md5
                };
                if (compressed) {
                    assets[relative].compressed = true;
                }
            })
        } catch (error) {
            Utils.error(error);
        } finally {
            return assets;
        }

    },

    /**
     * 拷贝热更目录到指定目录
     * @param {string} srcRootDir 绝对路径
     * @param {string} destRootDir 绝对路径
     * @returns 拷贝成功后的目录数组
     */
    copyManifestPaths(srcRootDir, destRootDir) {
        let dirs = [];
        try {
            manifestPaths.forEach(subDir => {
                let src = Path.join(srcRootDir, subDir);
                if (FsExtra.existsSync(src) == false) {
                    Utils.warn("热更目录不存在 " + src);
                    return;
                }
                // 清空目标目录
                let dest = Path.join(destRootDir, subDir);
                FsExtra.emptyDirSync(dest);
                Utils.log(src + "=>" + dest);
                FsExtra.copySync(src, dest);

                dirs.push(dest);
            })

        } catch (error) {
            Utils.error(error);
        } finally {
            return dirs;
        }

    },

    /**
     * 写入 project.manifest和version.manifest 文件到目录中
     * @param {string} destDir 模板目录
     * @param {Manifest} manifest 清单对象
     */
    writeManifest(destDir, manifest) {
        // 写入 project.manifest
        let file = Path.join(destDir, PROJECT_FILE_NAME);
        FsExtra.writeJSONSync(file, manifest);

        // 写入 version.manifest
        let version = JSON.parse(JSON.stringify(manifest));
        delete version.assets;
        delete version.searchPaths;

        file = Path.join(destDir, VERSION_FILE_NAME);
        FsExtra.writeJSONSync(file, version);

    },






    async zipDir(fsDir) {
        let dirName = path.basename(fsDir);
        let dir = path.dirname(fsDir);
        if (fs.existsSync(fsDir) == false) {
            Editor.error("zip错误,文件或目录不存在: " + fsDir);
            return;
        }
        let zip = new Jszip();
        // 1.创建一级目录
        zip.file(dirName, null, { dir: true, date: ZIP_COMMON_DATE });
        // 2.开始zip压缩目录
        this.ziped_dir(fsDir, zip.folder(dirName));

        let saveFile = path.join(dir, dirName + ".zip");
        fs.existsSync(saveFile) && (fs.unlinkSync(saveFile));
        let p = new Promise((resolve) => {
            zip.generateNodeStream({
                type: "nodebuffer",
                streamFiles: true
            }).pipe(fs.createWriteStream(saveFile)).on("finish",
                function () {
                    resolve(null);
                }.bind(this)).on("error",
                    function (e) {
                        resolve(e);
                    }.bind(this));
        });

        let err = await p;
        if (err) {
            Editor.error("zip失败: " + fsDir, saveFile);
            return;
        }
        if (fs.existsSync(saveFile) == false) {
            Editor.error("zip失败,文件不存在: " + fsDir, saveFile);
            return;
        }

        // 压缩成功后 移除目录
        FsUtils.rmdirSync(fsDir);
    },
    /**
     * 
     * @param {string} dir 
     * @param {Jszip} zipInstance
     */
    ziped_dir(dir, zipInstance) {
        let files = fs.readdirSync(dir);
        for (let i = 0; i < files.length; i++) {
            let fileName = files[i];
            if (fileName[0] == "." || fileName == "..") {
                continue;
            }
            let fullPath = path.join(dir, fileName);
            let stat = fs.statSync(fullPath);
            if (stat.isFile()) {
                /**
                 * zip文件的MD5会计算每一个文件的最后修改时间 由于子包中的每一个文件都是在每次构建时重新生成这将导致MD5始终不一致
                 * 所以此处忽略文件的修改时间(写死一个固定的时间)
                 */
                zipInstance.file(fileName, fs.readFileSync(fullPath), { date: ZIP_COMMON_DATE });
            } else if (stat.isDirectory()) {
                zipInstance.file(fileName, null, { dir: true, date: ZIP_COMMON_DATE });
                this.ziped_dir(fullPath, zipInstance.folder(fileName));
            }
        }
    },

}