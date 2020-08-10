import Button from './Button.vue'
let EnhancedElemUI = {}
EnhancedElemUI.install = function (Vue, options) {
  Vue.component(testPanel.name, Button) // testPanel.name 组件的name属性
}
export default EnhancedElemUI
