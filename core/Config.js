const FsExtra = require("fs-extra");
const Path = require("path");
const Utils = require("./Utils");

/**默认保存在 项目 settings/ 目录下 */
const SETTINGS_ROOT = Path.join(Utils.getProjectInfo().path, "settings");
const defaultSavePath = Path.join(SETTINGS_ROOT, Utils.getPackageInfo().name + ".json");


module.exports = {
    writeConfig(data, name) {
        if (name) {
            let config = this.readConfig();
            config[name] = data;
            data = config;
        }
        // 写入配置
        FsExtra.writeFileSync(defaultSavePath, JSON.stringify(data, null, 2), { "encoding": "utf8" });

        Utils.success("保存配置成功 " + name ? name : "");
    },

    readConfig(name) {
        let config;

        if (FsExtra.existsSync(defaultSavePath) == false) {
            config = {};
        }
        else {
            try {
                config = FsExtra.readJSONSync(defaultSavePath);
                // config = JSON.parse(config);
            } catch (error) {
                Utils.error("读取配置失败 " + defaultSavePath);
                config = {};
            }
        }

        if (name) {
            return config[name] || {};
        }

        return config;
    },


}