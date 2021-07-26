const FsExtra = require("fs-extra");
const Path = require("path");
const Config = require("../core/Config");
const Utils = require("../core/Utils");

const package = Utils.getPackageInfo();
const packageName = package.name;
const panelName = package["panel.03"].name;

const projectRoot = Utils.getProjectInfo().path;  // 绝对路径
const projectName = Utils.getProjectInfo().name;
const DEFAULT_SAVE = "HotUpdate";

Editor.Panel.extend({
  style: FsExtra.readFileSync(Editor.url(`packages://${packageName}/index.css`), "utf-8")
  ,
  template: FsExtra.readFileSync(Editor.url(`packages://${packageName}/${panelName}/index.html`), "utf-8")
  ,



  ready() {
    this.panel = new window.Vue({
      el: this.shadowRoot,
      data: {
        version: "",
        packageUrl: "http://",
        isPackageUrlAddVersion: true,
        saveDir: "HotUpdate",
        isZipImport: false,
        isZipNative: false,
      },

      init() {

      },

      created() {
        let config = this.readConfig();
        this.version = config.version || "0.0.0";
        this.packageUrl = config.packageUrl || "http://";
        this.isPackageUrlAddVersion = config.isPackageUrlAddVersion || false;
        this.saveDir = config.saveDir || DEFAULT_SAVE;
        this.isZipImport = config.isZipImport || false;
        this.isZipNative = config.isZipNative || false;
      },


      methods: {


        writeConfig() {
          Config.writeConfig({
            version: this.version,
            packageUrl: this.packageUrl,
            isPackageUrlAddVersion: this.isPackageUrlAddVersion,
            saveDir: this.saveDir,
            isZipImport: this.isZipImport,
            isZipNative: this.isZipNative,

          }, panelName);
        },

        readConfig() {
          return Config.readConfig(panelName);
        },
      }

    });
  },

  messages: {

    onBuildStart(event, strData) {

    },
    onBeforeChangeFiles(event, strData) {

    },
    onBuildFinished(event, strData) {
      if (event.reply) {
        // 返回热更配置信息
        let hotConfig = {
          version: this.panel.version,
          packageUrl: this.panel.packageUrl,
          isPackageUrlAddVersion: this.panel.isPackageUrlAddVersion,
          saveDir: this.panel.saveDir,
          isZipImport: this.panel.isZipImport,
          isZipNative: this.panel.isZipNative,
        }
        event.reply(null, JSON.stringify(hotConfig));
      }
    },

  }

});