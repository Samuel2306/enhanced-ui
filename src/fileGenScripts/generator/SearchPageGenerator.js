const path = require('path')
const fs = require('fs')
const BasePageGenerator = require(path.resolve(__dirname, './BasePageGenerator'))
const util = require('../util')
class SearchPageGenerator extends BasePageGenerator{
  constructor(options){
    super(options)
    this.template = [
      "<template>",
      "\t<div class='search-page-container'>",
      "\t\t<html-slot></html-slot>",
      "\t</div>",
      "</template>",
      "<script>",
      "<import-slot></import-slot>",
      "<export-slot></export-slot>",
      "</script>",
      "<style lang='scss'>",
      "\t.search-page-container{}",
      "</style>",
    ]
    this.componentList = [] // 在解析模块导入的时候会将相关的组件名加入到这个里面，方便后续的代码生成
    this.vuexModules = { // 在解析模块导入的时候解析当前页面有没有引入mapState这些vuex模块
      "mapState": false,
      "mapGetter": false,
      "mapMutations": false,
      "mapActions": false,
    }
    this._init()
  }
  async _init() {
    super._init()
    let _this = this
    let res = this.template.join("\n")
    let modulesScript = this.genModulesScripts()
    res = res.replace("<import-slot></import-slot>", modulesScript)
    let exportScript = this.genExportScripts()
    res = res.replace("<export-slot></export-slot>", exportScript)
    res = res.replace("<html-slot></html-slot>", this.options.template ? this.options.template : "")

    let folderPath = path.resolve(__dirname, "../../" + this.options.genTargetFolder)
    await fs.exists(folderPath, async function(exists) {
      if(!exists){
        await fs.mkdirSync(folderPath)
      }
      let genPath = folderPath + ("/" + _this.options.fileName)
      await _this.genFileToPackage(res, genPath)
      _this.genRouter()
    });
  }
  validate(){
    let flag = true
    flag = super.validate()
    return flag
  }
  // 自动在vue-router上面配置路由
  genRouter(){
    if(!this.options.routeName){
      return
    }
    let configPath = path.resolve(__dirname, '../routerConfig/config.json')
    let routerConfig = require(configPath)
    let newRoute = {
      "name": this.options.routeName,
      "filePath": "@/" + this.options.genTargetFolder + "/" + this.options.fileName,
      "routePath": this.options.routePath ? this.options.routePath : util.toLowerLine(this.options.fileName.substring(0, this.options.fileName.indexOf('.')), '-')
    }
    let flag = false
    routerConfig.forEach((route, index) => {
      if(route.name == newRoute.name){
        flag = true
        routerConfig.splice(index, 1, newRoute)
      }
    })
    if(!flag){
      routerConfig.push(newRoute)
    }
    fs.writeFile(configPath, JSON.stringify(routerConfig), function(err) {
      if(err) {
        return console.log(err);
      }
      console.log("更新路由配置成功");
    });
  }
}

module.exports = SearchPageGenerator
