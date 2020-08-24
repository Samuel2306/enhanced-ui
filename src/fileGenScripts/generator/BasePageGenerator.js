import {
  toCamel,
  toLowerLine
} from '../util'
class BasePageGenerator {
  static addGlobalModules(modules){
    if(Array.isArray(modules)){
      BasePageGenerator.globalModules = BasePageGenerator.globalModules.concat(modules)
    }else{
      BasePageGenerator.globalModules.push(modules)
    }
  }
  /**
   * @param options
   *  loadComponentUrl: 组件默认加载路径，组件可以自定义加载路径
   *  components：组件对象数组，每个对象有两个值：name--组件名  path--组件文件路径
   *  modules: 除组件外的所有依赖，每个依赖模块引入语句(import Vue from 'vue')，也可以是一些公开的模块名（比如说Vue, Vuex等），也可以是一个对象{name: 'util', path: '@/util'}
   *  otherScript: 自定义的一些js代码(代码字符串)
   */
  constructor(options){
    this.options = options
    if(this.validate && typeof this.validate == 'function'){
      let flag = this.validate()
      if(!flag) return
    }
  }
  validate(){
    let flag = true
    if(!this.options.fileName){
      console.error("生成文件的文件名不能为空")
      flag = false
    }
    return flag
  }
  _init(){
    console.log("开始生成页面")
    if(this.options.globalModules){  // 将一些特殊全局模块添加到全局模块列表中
      BasePageGenerator.addGlobalModules(this.options.globalModules)
    }
  }
  // 生成依赖相关的代码
  genModulesScripts(){
    let str = ''
    str += this._analysisModules()
    str += this._analysisComponents()
    str += this._analysisOtherScript()
    return str
  }
  _analysisModules(){
    let modules = this.options.modules || []
    let arr = modules.slice(0).filter((module) => {
      return typeof module == 'string' ? !!module.trim() : !!module
    }).map((module) => {
      if(typeof module == 'object'){
        return "import " + module.name + " from " + module.path
      }else if(BasePageGenerator.globalModules.indexOf(module) > -1){
        return "import " + toCamel(module, ['_','-'], true) + " from " + module
      }else {
        BasePageGenerator.vuexModules.forEach((vuexModuleName) => {
          if(module.indexOf(vuexModuleName) > -1 && this.vuexModules){
            this.vuexModules[vuexModuleName] = true
          }
        })
        return module.replace(";", "")
      }
    })
    return arr.length ? arr.join(";\n") + ";\n" : ""
  }
  _analysisComponents(){
    // 加载页面所有vue组件的路径
    let loadComponentUrl = this.options.loadComponentUrl
    let components = this.options.components ? (Array.isArray(this.options.components) ? this.options.components : []) : []
    let arr = []
    components.forEach((component) => {
      if(!component.name){
        console.error("引入的组件必须定义组件名！")
      }
      if(this.componentList){
        this.componentList.push(component.name)
      }
      arr.push("import " + component.name + " from " + (component.path || loadComponentUrl))
    })
    return arr.length ? arr.join(";\n") : ""
  }
  _analysisOtherScript(){
    return this.options.otherScript ? this.options.otherScript + ';\n' : ''
  }

  genExportScripts(){
    let str = "export default {\n"
    let pageName = this.options.pageName ? this.options.pageName : JSON.stringify("searchPage")
    let pageNameStr = "\tname: " + pageName + ",\n"

    let attrs = ""
    if(this.options.data && typeof this.options.data == 'object'){
      for(let prop in this.options.data){
        attrs = attrs + "\t\t\t" + prop + ": " + JSON.stringify(this.options.data[prop]) + ',\n'
      }
    }
    let data = [
      "\tdata(vm){\n",
        "\t\treturn{\n" + attrs + '\t\t}\n',
      "\t},\n",
    ].join('')

    let props = "\tprops: {},\n"

    let computed = [
      "\tcomputed: {\n",
    ]
    if(this.vuexModules && this.vuexModules.mapState){
      computed.push("\t\t...mapState({\n\t\t\t// 使用实例 name: state => state.homeState.name\n\t\t}),\n")
    }
    if(this.vuexModules && this.vuexModules.mapGetter){
      computed.push("\t\t...mapGetter({\n\t\t\t// 使用实例 getName: 'homeState/getName'\n\t\t}),\n")
    }
    computed.push("\t},\n")
    computed = computed.join("")

    let components = "\tcomponents: {\n"
    this.componentList.forEach((comp) => {
      components += "\t\t" + JSON.stringify("v-" + toLowerLine(comp, '-')) + ": " + comp + ",\n"
    })
    components += "\t},\n"
    let methods = ["\tmethods: {\n"]
    if(this.vuexModules && this.vuexModules.mapMutations){
      methods.push("\t\t...mapMutations({\n\t\t\t// 使用实例 setName: 'homeState/setName'\n\t\t}),\n")
    }
    if(this.vuexModules && this.vuexModules.mapActions){
      methods.push("\t\t...mapActions({\n\t\t\t// 使用实例 setName: 'homeState/getName'\n\t\t}),\n")
    }
    let m = ''
    if(this.options.methods && typeof this.options.methods == 'object'){
      for(let prop in this.options.methods){
        let str = this.options.methods[prop].toString()
        str = str.substring(str.indexOf("(")).replace(/\s*}/g, "\n\t\t}").replace(/_this[0-9]/g,"this")
        str = str.substring(0, str.indexOf(")") + 1) + str.substring(str.indexOf("{"))
        m = m + '\t\t' + prop + str + ',\n'
      }
    }
    methods = methods.concat([m, "\t},\n"]).join("") + '\n'
    let created = "\tcreated(){},\n"
    let mounted = "\tmounted(){},\n"

    return str + pageNameStr + components + data + computed + props + created + methods + mounted + '}'
  }
  downloadFile(res){
    let blob = new Blob(
      [res],
      {type: "text/html"}
    );
    let downloadElement = document.createElement('a');
    let href = window.URL.createObjectURL(blob); // 创建下载的链接
    downloadElement.href = href;
    downloadElement.download = this.options.fileName; // 下载后文件名
    document.body.appendChild(downloadElement);
    downloadElement.click(); // 点击下载
    document.body.removeChild(downloadElement); // 下载完成移除元素
    window.URL.revokeObjectURL(href); // 释放掉blob对象
  }
}
BasePageGenerator.globalModules = [
  'vue',
  'vuex',
  'axios',
]
BasePageGenerator.vuexModules = ["mapState", "mapGetter", "mapMutations", "mapActions"]

export default BasePageGenerator
