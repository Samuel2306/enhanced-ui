<template>
  <el-form
    :ref="'dynamic_form' + ts"
    class="dynamic-form"
    :inline="formConfig.inline"
    :model="value"
    :label-position="formConfig.labelPosition"
    :label-width="formConfig.labelWidth || labelWidth"
    :size='formConfig.size'
    :status-icon="formConfig.statusIcon">
    <el-row :gutter="formConfig.gutter || gutter">
      <dynamic-form-item
        :ref="item.key + ts"
        :span="formConfig.cols ? 24 / formConfig.cols : 24 / defaultCols"
        v-for="item in formConfig.formItemList"
        :key="item.key"
        :item="item"
        :formItemList="formConfig.formItemList"
        :value="value[item.key]"
        @input="handleInput($event, item.key)"
        v-show="item.visible || item.visible == null"
      />
    </el-row>
  </el-form>
</template>

<script>
  import DynamicFormItem from './dynamic_form_item'
  export default {
    name: "DynamicForm",
    components: {
      'dynamic-form-item': DynamicFormItem
    },
    data(){
      return {
        ts: Date.now(),
        gutter: 20,
        labelWidth: '80px',
        defaultCols: 3
      }
    },
    props: {
      formConfig: {  // 整个表达的配置参数
        type: Object,
        required: true
      },
      value: {
        type: Object,
        required: true
      }
    },
    methods: {
      handleInput(val, key) {
        // 这里element-ui没有上报event，直接就是value了,  val原来是$event对象
        this.$emit('input', { ...this.value, [key]: val })
      },
      setDefaultValue() {
        const formData = { ...this.value }
        // 设置默认值
        this.formConfig.formItemList.forEach(({ key, value }) => {
          if (formData[key] === undefined || formData[key] === null) {
            formData[key] = value
          }
        })
        this.$emit('input', formData)
      }
    },
    mounted() {
      this.setDefaultValue()
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

    },
  }
</script>

<style lang="scss">
  .dynamic-form{
    .el-form-item__content{
      .el-select{
        width: 100%;
      }
      .el-cascader{
        width: 100%;
      }
    }
  }
</style>
