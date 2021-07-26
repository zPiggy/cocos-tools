'use strict';

const IPC = require("./core/IPC");
const Utils = require("./core/Utils");
const HotUpdate = require("./hot-update/HotUpdate");








module.exports = {

  load() {
    // Editor.Builder.on('build-start', this.onBuildStart);
    // Editor.Builder.on('before-change-files', this.onBeforeChangeFiles);
    // Editor.Builder.on('build-finished', this.onBuildFinished);
  },

  unload() {
    // Editor.Builder.removeListener('build-start', this.onBuildStart);
    // Editor.Builder.removeListener('before-change-files', this.onBeforeChangeFiles);
    // Editor.Builder.removeListener('build-finished', this.onBuildFinished);
  },
  /**编译开始 */
  async onBuildStart(options, callback) {
    try {

    } catch (error) {
      Utils.error(error);
    } finally {
      callback();
    }
  },

  async onBeforeChangeFiles(options, callback) {
    try {

    } catch (error) {
      Utils.error(error);
    } finally {
      callback();
    }
  },

  async onBuildFinished(options, callback) {
    try {
      // Utils.log(options);
      await HotUpdate.build(options);
      Utils.log(13)

    } catch (error) {
      Utils.error(error);
    } finally {
      callback();
    }
  },

  messages: {
    "build-template-tools"() {
      // Editor.Panel.open('cocos-tools.02');
      Utils.openPanel("02");
    },
    "hot-update"() {
      Utils.openPanel("03");
      // Editor.Panel.open('cocos-tools.03');
    }
  },
};