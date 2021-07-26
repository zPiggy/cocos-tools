const Utils = require("./Utils");

const package = Utils.getPackageInfo();
const packName = package.name;
const Ipc = Editor.Ipc

module.exports = {
    /**
     * 发送消息到面板
     * @param {string} id 面板ID 单面板传 null
     * @param {string} funcName 方法名
     * @param {any} data 数据
     * @returns {Promise<[Error,string]>}
     */
    async sendToPanel(id, funcName, data) {
        return new Promise((resolve) => {
            let panelName = Utils.getPanelID(id);
            if (data && typeof data != "string") {
                data = JSON.stringify(data);
            }

            Ipc.sendToPanel(panelName, funcName, data, (error, retData) => {
                if (error) {
                    Utils.error("sendToPanel::", panelName, funcName);
                    Utils.error(error);
                    resolve(error);
                }
                else {
                    // 尝试JSON
                    if (typeof retData === "string") {
                        try {
                            let obj = JSON.parse(retData);
                            resolve([null, obj]);
                        } catch (error) {
                            resolve([null, retData]);
                        }

                    }
                    else {
                        resolve([null, retData]);
                    }

                }
            })

        });
    },
    /**
    * 发送消息到主进程
    * @param {string} funcName
    * @param {any} data
    * @returns {Promise<[Error,string]>}
    */
    async sendToMain(funcName, data) {
        return new Promise((resolve) => {
            if (data && typeof data != "string") {
                data = JSON.stringify(data);
            }
            Ipc.sendToMain(packName + ":" + funcName, data, (error, retData) => {
                if (error) {
                    Utils.error("sendToMain::", packName, packName + ":" + funcName);
                    Utils.error(error);
                }
                // 尝试JSON
                try {
                    if (typeof retData === "string") {
                        let obj = JSON.parse(retData);
                        resolve([error, obj]);
                    }
                } catch (error) {
                    resolve([error, retData]);
                }
            })
        });
    },
}