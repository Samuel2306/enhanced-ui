const Button = require('./ExtendedButton/Index.vue')
let EnhancedElemUI = {}
EnhancedElemUI.install = function (Vue, options) {
  console.log("enter install")
  Vue.component(Button.name, Button) // Button.name 组件的name属性
}
module.exports = EnhancedElemUI
