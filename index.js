import ExtendedButton from './src/components/ExtendedButton.vue'

let install = function (Vue, options) {
  if(install.installed) return
  Vue.component(ExtendedButton.name, ExtendedButton)
  install.installed = true
}
if(typeof window !== 'undefined' && window.Vue){
  install(window.Vue)
}
export default {
  install,
  ExtendedButton
}
