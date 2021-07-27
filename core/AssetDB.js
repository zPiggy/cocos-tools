
const assetsUrlRoot = "db://assets";

module.exports = {
    get mainAssetdb() {
        if (Editor.isMainProcess) {
            return Editor.assetdb;
        }
        return Editor.remote.assetdb;
    },
    isUrl(url) {
        if (url && typeof url === "string") {
            return url.startsWith(assetsUrlRoot);
        }
        return false;
    },
    fspathToUrl(fspath) {
        return this.mainAssetdb.fspathToUrl(fspath);
    },
    urlToFspath(url) {
        return this.mainAssetdb.urlToFspath(url);
    },

    exists(url) {
        return this.mainAssetdb.exists(url);
    },
    existsByUuid(uuid) {
        return this.mainAssetdb.existsByUuid(uuid);
    },
    existsByPath(fspath) {
        return this.mainAssetdb.existsByPath(fspath);
    },

    /**刷新资源 */
    async refresh(url) {
        return new Promise((resolve) => {
            this.mainAssetdb.refresh(url, function (err, results) {
                resolve([err, results]);
            });
        })
    },
    async refreshByPath(fspath) {
        let url = this.fspathToUrl(fspath);
        if (this.isUrl(url)) {
            return this.refresh(url);
        }
        return [new Error(`${fspath} 无法转为 url`)];
    },


    /**
     * 创建资源
     * @param {string} url 
     * @param {string} data 
     * @returns 
     */
    async create(url, data) {
        return new Promise((resolve) => {
            this.mainAssetdb.create(url, data, function (err, results) {
                resolve(err, results);
            });
        })
    },
    /**
     * 刷新资源
     * @param {string} url 
     * @param {string} data 
     * @returns 
     */
    async saveExists(url, data) {
        return new Promise((resolve) => {
            this.mainAssetdb.saveExists(url, data, function (err, meta) {
                resolve(err, meta);
            });
        });
    },

    /**
     * 导入资源
     * @param {string[]} fspaths 
     * @param {string} url 
     * @returns 
     */
    async import(fspaths, url) {
        return new Promise((resolve) => {
            Editor.assetdb.import(fspaths, url, function (err, results) {
                resolve(err, results);
            });
        })
    },

    async createOrSave(url, data) {
        if (this.exists(url)) {
            return this.saveExists(url, data);
        }
        else {
            return this.create(url, data);
        }
    },

}