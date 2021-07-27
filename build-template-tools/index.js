const FsExtra = require("fs-extra");
const Path = require("path");
const Config = require("../core/Config");
const Utils = require("../core/Utils");

const package = Utils.getPackageInfo();
const packageName = package.name;
const panelName = package["panel.02"].name;

const projectRoot = Utils.getProjectInfo().path;  // 绝对路径
const projectName = Utils.getProjectInfo().name;
const buildTemplateRoot = Path.join(projectRoot, "build-templates");
const DEFAULT_BUILD = "build";

Editor.Panel.extend({
  style: FsExtra.readFileSync(Editor.url(`packages://${packageName}/index.css`), "utf-8")
  ,
  template: FsExtra.readFileSync(Editor.url(`packages://${packageName}/${panelName}/index.html`), "utf-8")
  ,



  ready() {
    new window.Vue({
      el: this.shadowRoot,
      data: {
        /**@type {string} */
        buildRoot: "",
        /**@type {number} */
        selectBuildDir: 0,
        /**@type {string[]} */
        buildDirs: [],
        /**编译模板目录 */
        buildTemplateDir: "Native",
      },

      init() {
      },

      created() {
        let config = this.readConfig();
        this.buildRoot = config.buildRoot || DEFAULT_BUILD;
        this.selectBuildDir = config.selectBuildDir;
        this.buildTemplateDir = config.buildTemplateDir || "Native";
        this.initBuildRoot();
      },


      methods: {
        initBuildRoot() {
          this.buildDirs = this.getBuildDirs();
          if (!this.buildDirs[this.selectBuildDir]) {
            this.selectBuildDir = 0;    // 默认选中 0
          }
        },
        /**获取编译目录 */
        getBuildDirs() {
          let dirs = [];
          let dir = Path.join(projectRoot, this.buildRoot);
          if (FsExtra.existsSync(dir)) {
            let files = FsExtra.readdirSync(dir);
            files.forEach((file) => {
              if (file.startsWith(".")) {
                return;
              }
              let url = Path.join(dir, file);
              if (FsExtra.statSync(url).isDirectory()) {
                dirs.push(file);
              }
            });
          }

          return dirs;
        },
        /**根据编译模板导出从build目录导出最新文件到模板目录(仅文件同名覆盖) */
        onExportClicked() {
          try {
            let buildName = this.buildDirs[this.selectBuildDir];
            // 校验编译目录是否存在
            if (!buildName) {
              Editor.log("请先选择一个编译目录");
              return;
            }
            let buildPath = Path.join(projectRoot, this.buildRoot, buildName);
            if (!FsExtra.existsSync(buildPath)) {
              Editor.log(`目录不存在:${buildPath}`);
              return;
            }

            // 读取模板文件
            let buildTemplatePath = Path.join(Utils.getProjectInfo().path, this.buildTemplateDir, buildName);
            if (!FsExtra.existsSync(buildTemplatePath)) {
              Utils.log(`模板目录为空 ${Utils.relativeProject(buildTemplatePath)}`);
              return;
            }
            Utils.log(`更新模板目录: .../${Utils.relativeProject(buildTemplatePath)}`);
            let files = Utils.readDirs(buildTemplatePath);
            // Utils.log(files);
            // 拷贝同名文件
            files.forEach(file => {
              let srcFile = file.replace(buildTemplatePath, buildPath);
              if (FsExtra.existsSync(srcFile)) {
                FsExtra.copyFileSync(srcFile, file);
                Utils.log(`.../${Utils.relativeProject(file)}`);
              }
              else {
                Utils.warn(`更新失败: 源文件不存在 .../${Utils.relativeProject(srcFile)}`);
              }
            })
          } catch (error) {
            Utils.error(error);
          }
        },

        onBuildRootConfirm() {
          this.initBuildRoot();
        },


        writeConfig() {
          Config.writeConfig({
            buildRoot: this.buildRoot,
            selectBuildDir: this.selectBuildDir,
            buildTemplateDir: this.buildTemplateDir,
          }, panelName);
        },
        readConfig() {
          return Config.readConfig(panelName);
        }

      }
    });
  },

  messages: {

  }

});