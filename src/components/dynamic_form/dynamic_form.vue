<template>
  <el-form
    v-if="startRenderFrom"
    class="dynamic-form"
    v-bind="configuration">
    <el-row :gutter="formConfig.gutter">
      <dynamic-form-item
        :ref="item.key + ts"
        :span="span * item.cols"
        v-for="item in formItemList"
        :key="item.key"
        :item="item"
        :formItemList="formItemList"
        :value="formData[item.key]"
        @input="handleInput($event, item.key)"
        v-show="item.visible || item.visible == null" />
    </el-row>
  </el-form>
</template>

<script>
  import {
    deepCopy
  } from '../../utils/my-util'
  import DynamicFormItem from './dynamic_form_item'
  export default {
    name: "DynamicForm",
    components: {
      'dynamic-form-item': DynamicFormItem
    },
    created(){
      this.formConfig.formItemList.forEach((item) => {
        this.formData[item.key] = item.value
      })
      this.startRenderFrom = true
      this.setDefaultValue()
    },
    data(){
      return {
        ts: Date.now(),

        formData: {},
        startRenderFrom: false
      }
    },
    props: {
      // 整个表单的配置参数
      formConfig: {
        type: Object,
        required: true
      },
    },
    computed: {
      configuration(){
        let res = {
          /* 跟布局相关的属性 */
          gutter: 20,
          cols: 3,
          /* 跟布局相关的属性 */

          "model": this.formData,
          // "rules": [],  // 表单提交验证规则列表
          "inline": false,
          "labelWidth": "70px",
          "labelPosition": "right",
          "labelSuffix": "",
          "hideRequiredAsterisk": false,  // 是否显示必填字段的标签旁边的红色星号
          "showMessage": true,  // 是否显示校验错误信息
          "inlineMessage": false,  // 是否以行内形式展示校验信息
          "statusIcon": false, // 是否在输入框中显示校验结果反馈图标
          "validateOnRuleChange": true,  // 是否在 rules 属性改变后立即触发一次验证
          "size": "medium",
          "disabled": false,  // 是否禁用该表单内的所有组件。若设置为 true，则表单内组件上的 disabled 属性不再生效
        }
        for(let prop in this.formConfig){
          if(this.formConfig.hasOwnProperty(prop) && prop != 'formItemList' && prop != 'gutter' && prop != 'cols'){
            res[prop] = this.formConfig[prop]
          }
        }

        return res
      },
      span(){
        if(!this.formConfig.cols){
          return 8
        }
        if(typeof this.formConfig.cols != 'number'){
          console.error("formConfig的cols属性只能为数字类型")
          return 8
        }
        return 24 / this.formConfig.cols
      },
      // 标准化formConfig.formItemList里面的每一个组件
      formItemList(){
        let list = this.formConfig.formItemList.slice(0)
        let standard = {
          visible: true,
          disabled: false,
          cols: 1
        }
        for (let i = 0; i < list.length; i++) {
          for(let prop in standard) {
            if (list[i][prop] == undefined) {
              list[i][prop] = standard[prop]
            }
          }
        }
        return list.slice(0)
      }
    },
    methods: {
      handleInput(val, key) {
        // 这里element-ui没有上报event，直接就是value了,  val原来是$event对象
        this.formData = { ...this.formData, [key]: val }
        this.$emit('update', deepCopy(this.formData))
      },
      setDefaultValue() {
        this.$emit('update', deepCopy(this.formData))
      },
      getFormData(){
        return deepCopy(this.formData)
      },
      setStyle(){
        this.$nextTick(() => {
          let form = this.$refs['dynamic_form' + this.ts].$el
          let dynamicFormItems = form.getElementsByClassName('dynamicFormItem')
          for (let i = 0; i < dynamicFormItems.length; i++) {
            let item = dynamicFormItems[i]
            item.style.position = 'relative'
            item.style.width = '100%'
            let label = item.getElementsByClassName('el-form-item__label')
            if(label && label[0]){
              label[0].style.width = this.formConfig.labelWidth || this.labelWidth
              label[0].style.position = 'absolute'
              label[0].style.left = '0'
              label[0].style.top = '0'
            }
            let content = item.getElementsByClassName('el-form-item__content')
            if(content && content[0]){
              content[0].style.textAlign = 'left'
              content[0].style.position = 'absolute'
              content[0].style.left = this.formConfig.labelWidth || this.labelWidth
              content[0].style.right = '0'
              content[0].style.top = '0'
            }
          }
        })
      }
    },
    mounted() {
      // this.setStyle()
    },
  }
</script>

<style lang="scss">
  .dynamic-form{
    .el-form-item__content{
      text-align: left !important;
      .el-select{
        width: 100%;
      }
      .el-cascader{
        width: 100%;
      }
    }
  }
</style>
