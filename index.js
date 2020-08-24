import ExtendedButton from './src/components/button/button.vue'
import ExtendedSelect from './src/components/select/select.vue'
import ExtendedOption from './src/components/select/option.vue'
import ExtendedOptionGroup from './src/components/select/option-group.vue'
import ExtendedElSelectDropdown from './src/components/select/select-dropdown.vue'
import ExtendedElScrollbar from './src/components/scrollbar'
import ExtendedDynamicForm from './src/components/dynamic_form/dynamic_form.vue'

let install = function (Vue, options) {
  if(install.installed) return
  Vue.component(ExtendedButton.name, ExtendedButton)
  Vue.component(ExtendedSelect.name, ExtendedSelect)
  Vue.component(ExtendedOption.name, ExtendedOption)
  Vue.component(ExtendedOptionGroup.name, ExtendedOptionGroup)
  Vue.component(ExtendedElSelectDropdown.name, ExtendedElSelectDropdown)
  Vue.component(ExtendedElScrollbar.name, ExtendedElScrollbar)
  Vue.component(ExtendedDynamicForm.name, ExtendedDynamicForm)
  install.installed = true
}
if(typeof window !== 'undefined' && window.Vue){
  install(window.Vue)
}
export default {
  install,
  ExtendedButton,
  ExtendedSelect,
  ExtendedOption,
  ExtendedOptionGroup,
  ExtendedElSelectDropdown,
  ExtendedElScrollbar,
  ExtendedDynamicForm,
}
