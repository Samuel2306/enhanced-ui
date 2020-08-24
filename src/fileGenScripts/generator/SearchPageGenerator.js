import BasePageGenerator from './BasePageGenerator'
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
  _init() {
    super._init()
    let res = this.template.join("\n")
    let modulesScript = this.genModulesScripts()
    res = res.replace("<import-slot></import-slot>", modulesScript)
    let exportScript = this.genExportScripts()
    res = res.replace("<export-slot></export-slot>", exportScript)
    res = res.replace("<html-slot></html-slot>", this.options.template ? this.options.template : "")
    console.log(res)
    return
    this.downloadFile(res)
  }
  validate(){
    let flag = true
    flag = super.validate()
    return flag
  }

}

export default SearchPageGenerator
