/**

@typedef {{
    root: string,  // bundle 的根目录
    dest: string,  // bundle 的输出目录
    scriptDest: string, // 脚本的输出目录
    name: string, // bundle 的名称
    priority: number, // bundle 的优先级
    scenes: string[], // bundle 中包含的场景
    compressionType: 'subpackage'|'normal'|'none'|'merge_all_json'|'zip', // bundle 的压缩类型
    buildResults: BuildResults, // bundle 所构建出来的所有资源
    version: string, // bundle 的版本信息，由 config 生成
    config: any, // bundle 的 config.json 文件
    isRemote: boolean // bundle 是否是远程包
}} Bundle


*/
