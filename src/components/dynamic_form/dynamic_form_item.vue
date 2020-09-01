<template>
  <el-col :span="span">
    <el-form-item class="dynamicFormItem" :label="item.label" :prop="item.key">

      <!-- 自定义组件 item.component是一个自定义的全局组件名 -->
      <component
        :is="$attrs.componentName"
        v-if="$attrs.type == 'formatter'"
        @input="componentInput">
      </component>

      <!-- element组件 -->
      <el-input
        v-if="$attrs.componentName==='el-input'"
        v-bind="$attrs"
        v-on="$listeners">
        <component
          v-bind="item.prepend.attrs"
          v-if="item.prepend"
          :is="item.prepend.name"
          slot="prepend">
          {{item.prepend.content}}
        </component>
        <component
          v-bind="item.append.attrs"
          v-if="item.append"
          :is="item.append.name"
          slot="append">
          {{item.append.content}}
        </component>
      </el-input>


      <el-select
        v-else-if="$attrs.componentName==='el-select'"
        v-bind="$attrs"
        v-on="$listeners"
        :multiple="item.multiple"
        :disabled="item.disabled"
        :multiple-limit="item.multipleLimit"
        @visible-change="visibleChange"
        @change="changeSelect($event,item)">
        <el-option
          v-for="o in (item.options || [])"
          :key="o.value"
          :label="o.label"
          :value="o.value"
          :disabled="o.disabled">
        </el-option>
      </el-select>


      <el-radio-group
        v-else-if="item.componentName==='el-radio'"
        v-bind="$attrs"
        v-on="$listeners"
        :disabled="item.disable"
        :readonly="item.readonly">
        <el-radio-button
          v-if="item.button"
          v-for="(option,index) in (item.options || [])"
          :key="index"
          :disabled="option.disabled"
          :label="option.value">
          {{option.label}}
        </el-radio-button>
        <el-radio
          v-if="!item.button"
          v-for="(option,index) in (item.options || [])"
          :key="index"
          :disabled="option.disabled"
          :label="option.value">
          {{option.label}}
        </el-radio>
      </el-radio-group>
      <el-checkbox-group
        v-else-if="item.componentName==='el-checkbox'"
        v-bind="$attrs" v-on="$listeners"
        :max="item.max"
        :min="item.min"
        :disabled="item.disable"
        :readonly="item.readonly">
        <el-checkbox-button
          v-if="item.button"
          v-for="(option,index) in (item.options || [])"
          :key="index"
          :disabled="option.disabled"
          :label="option.value">
          {{option.label}}
        </el-checkbox-button>
        <el-checkbox
          v-if="!item.button"
          v-for="(option,index) in (item.options || [])"
          :key="index"
          :disabled="option.disabled"
          :label="option.value">
          {{option.label}}
        </el-checkbox>
      </el-checkbox-group>

      <el-cascader
        v-else-if="item.componentName==='el-cascader'"
        :options="item.options"
        :props="item.props"
        @change="componentInput"
        :show-all-levels="false"
        collapse-tags
        clearable>
      </el-cascader>
      <!-- element组件 -->

      <!-- 无法识别的组件提示 -->
      <span v-else>未知控件类型</span>
    </el-form-item>
  </el-col>

</template>

<script>
  export default {
    name: "DynamicFormItem",
    props: {
      formItemList: {
        type: Array,
        required: true
      },
      // 每个表单元素在栅格化系统中所占的列数
      span: {
        type: Number,
        default: 8
      }
    },
    computed: {
      componentIndex(){
        return this.$attrs.componentIndex || 0
      },
      item(){
        return this.formItemList[this.componentIndex] || {}
      }
    },
    data(){
      return {
        oldSelectValue: null,
        newSelectValue: null,
      }
    },
    methods: {
      componentInput(value){
        this.$emit('input', value)
      },

      copyValue(target, source){
        if(typeof source == 'object' && source){
          if(Array.isArray(source)){
            target = source.slice(0)
          }else{
            target = Object.assign({}, source)
          }
        }else{
          target = source
        }
        return target
      },
      visibleChange(bool){
        if(bool){
          this.oldSelectValue = this.copyValue(this.oldSelectValue, this.newSelectValue)
        }
      },
      async changeSelect(value, item){
        let flag = item.changePreValidate ? await item.changePreValidate(this.oldSelectValue, value, item, this.formItemList) : true
        if(flag){
          this.newSelectValue = value
          this.oldSelectValue = this.copyValue(this.oldSelectValue, this.newSelectValue)
          item.changeCallback && item.changeCallback(value, Object.assign({}, item), this.formItemList)
        }else{
          this.newSelectValue = this.copyValue(this.newSelectValue, this.oldSelectValue)
        }
      }
    },
    mounted(){
      this.$nextTick(() => {
        if(this.item.getOptionsAsync){
          this.item.getOptionsFunc && this.item.getOptionsFunc(this.item, this.formItemList)
        }
      })
    }
  }
</script>

<style lang="scss">
  .dynamicFormItem{
    height: 32px;
  }
</style>
