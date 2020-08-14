const Button = require('./src/components/Button.vue')
let EnhancedUI = {
  name: 'EnhancedUI'
}
EnhancedUI.install = function (Vue, options) {
  Vue.component("extended-button", Button)
}
module.exports = EnhancedUI
