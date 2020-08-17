import ExtendedButton from './src/components/button/ExtendedButton.vue'
// import ExtendedSelect from './src/components/button/ExtendedSelect.vue'

let install = function (Vue, options) {
  if(install.installed) return
  Vue.component(ExtendedButton.name, ExtendedButton)
  // Vue.component(ExtendedSelect.name, ExtendedSelect)
  install.installed = true
}
if(typeof window !== 'undefined' && window.Vue){
  install(window.Vue)
}
export default {
  install,
  ExtendedButton,
  // ExtendedSelect
}
