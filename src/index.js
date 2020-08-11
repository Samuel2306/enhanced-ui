import Button from './ExtendedButton/Index.vue'
let EnhancedElemUI = {}
EnhancedElemUI.install = function (Vue, options) {
  Vue.component(Button.name, Button) // Button.name 组件的name属性
}
module.exports = EnhancedElemUI
