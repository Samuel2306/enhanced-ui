<template>
  <div id="app">
    <img src="./assets/logo.png">
    {{formData}}
    <extended-button :queue="[this.h1, this.h2]" :params="params" @handleParams="handleParams" type="primary"/>
    <extended-select
      multiple
      clearable
      v-model="value"
      @change="changeSelect">
      <extended-el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value">
      </extended-el-option>
    </extended-select>
    <extended-dynamic-form
      :formConfig="formConfig"
      v-model="formData" />
    <button @click="genFile">按钮</button>
  </div>
</template>

<script>
  import Vue from 'vue'
  import Button from '@/components/button/button.vue'
  import Select from '@/components/select/select.vue'
  import ExtendedElOption from '@/components/select/option.vue'
  import ExtendedDynamicForm from '@/components/dynamic_form/dynamic_form.vue'
  Vue.component("extended-button", Button)
  Vue.component("extended-select", Select)
  Vue.component("extended-el-option", ExtendedElOption)
  Vue.component("extended-dynamic-form", ExtendedDynamicForm)
  import SearchPageGenerator from '@/fileGenScripts/generator/SearchPageGenerator'


  let searchModel = {
    name: 'searchModel',
    post: function(params){
      console.log(params)
      return Promise.resolve("searchModel")
    }
  }
  let editModel = {
    name: 'editModel',
    post: function(params){
      console.log(params)
      return Promise.resolve("editModel")
    }
  }
  let delModel = {
    name: 'delModel',
    post: function(params){
      console.log(params)
      return Promise.resolve("delModel")
    }
  }
  let cancelModel = {
    name: 'cancelModel',
    post: function(params){
      console.log(params)
      return Promise.resolve("cancelModel")
    }
  }
export default {
  name: 'app',
  data (vm) {
    return {
      msg: 'Welcome to Your Vue.js App',
      params: 0,
      options: [{
        value: '选项1',
        label: '黄金糕'
      }, {
        value: '选项2',
        label: '双皮奶'
      }, {
        value: '选项3',
        label: '蚵仔煎'
      }, {
        value: '选项4',
        label: '龙须面'
      }, {
        value: '选项5',
        label: '北京烤鸭'
      }],
      value: '',


      fileList: null,
      columnsData: [
        {
          label: '日期',
          attrName: 'date',
          width: 180,
        },
        {
          label: '用户',
          type: 'formatter',
          component: 'product_list_table_user_component',
        },
        {
          label: '操作',
          type: 'formatter',
          component: 'product_list_table_operation_component',
        },
      ],
      content: "",
      handlerMap: {
        search: {
          paramsExchange: function(row){
            return row
          },
          handlerModel: searchModel,
          callback: ((res) => {
            console.log(this)
            console.log(res)
          }).bind(vm),
        },
        edit: {
          paramsExchange: function(row){
            return row
          },
          handlerModel: editModel,
          callback: ((res) => {
            console.log(this)
            console.log(res)
          }).bind(vm),
        },
        cancel: {
          paramsExchange: function(row){
            return row
          },
          handlerModel: cancelModel,
          callback: ((res) => {
            console.log(this)
            console.log(res)
          }).bind(vm),
        },
        del: {
          paramsExchange: function(row){
            return row
          },
          handlerModel: delModel,
          callback: ((res) => {
            console.log(this)
            console.log(res)
          }).bind(vm),
        },
      },
      optionsList: [
        {
          attrName: 'productName',
          initValue: '雨伞',
          exchange: function(value){
            return value
          },
          component: 'product_list_form_input'
        }
      ],
      formData: {
        "name": "Genji",
        "gender": "1",
        "origin": "",
        "love": [],
        "city": [],
      },
      formConfig: {
        "inline": true,
        "labelPosition": "right",
        "labelWidth": "",
        "size": "small",
        "statusIcon": true,
        "formItemList": [
          {
            "type": "input",
            "label": "姓名",
            "disable": false,
            "readonly": false,
            "value": "",
            "placeholder": "请输入姓名",
            "rules": [],
            "key": "name",
            "subtype": "text"
          },
          {
            "type": "select",
            "label": "来源",
            "multiple": false,
            "multipleLimit": 3,
            "value": "",
            "placeholder": "请输入姓名",
            "rules": [],
            "key": "origin",
            "options": [
              {"label": "精品商城","value": "PT001"},
              {"label": "车商城","value": "PT003"}
            ]
          },
          {
            "type": "radio",
            "label": "性别",
            "value": "",
            "button": false,
            "border": true,
            "rules": [],
            "key": "gender",
            "options": [
              {
                "value": 1,
                "label": "男",
                "disabled": false
              },
              {
                "value": 0,
                "label": "女",
                "disabled": false
              }
            ]
          },
          {
            "type": "checkbox",
            "label": "爱好",
            "value": [],
            "button": true,
            "border": true,
            "rules": [],
            "key": "love",
            "min": 0,
            "max": 100,
            "options": [
              {
                "value": "1",
                "label": "游泳",
                "disabled": false
              },
              {
                "value": "2",
                "label": "看电影",
                "disabled": false
              },
              {
                "value": "3",
                "label": "打篮球",
                "disabled": false
              }
            ]
          },
          {
            "type": "cascader",
            "label": "城市",
            "value": [],
            "rules": [],
            "key": "city",
            props: { multiple: true },
            "options": [{
              value: 1,
              label: '东南',
              children: [{
                value: 2,
                label: '上海',
                children: [
                  { value: 3, label: '普陀' },
                  { value: 4, label: '黄埔' },
                  { value: 5, label: '徐汇' }
                ]
              }, {
                value: 7,
                label: '江苏',
                children: [
                  { value: 8, label: '南京' },
                  { value: 9, label: '苏州' },
                  { value: 10, label: '无锡' }
                ]
              }, {
                value: 12,
                label: '浙江',
                children: [
                  { value: 13, label: '杭州' },
                  { value: 14, label: '宁波' },
                  { value: 15, label: '嘉兴' }
                ]
              }]
            }, {
              value: 17,
              label: '西北',
              children: [{
                value: 18,
                label: '陕西',
                children: [
                  { value: 19, label: '西安' },
                  { value: 20, label: '延安' }
                ]
              }, {
                value: 21,
                label: '新疆维吾尔族自治区',
                children: [
                  { value: 22, label: '乌鲁木齐' },
                  { value: 23, label: '克拉玛依' }
                ]
              }]
            }]
          }
        ]
      }
    }
  },
  methods: {
    genFile(){
      new SearchPageGenerator({
        fileName: 'a.vue',
        modules: ['vue', 'axios', "import { mapState, mapMutations, mapGetter, mapActions} from 'vuex'"],
        data: {
          name: "sf",
          age: 28,
          list: [
            {name: "sf", age: 28},
            {name: "sf1", age: 29},
          ],
          target: null
        },
        props: {
          name: Boolean,
        },
        methods: {
          add(){
            console.log(this.name)
          },
          multiply: function(){
            console.log(this.name)
          },
          multiply1: () => {
            console.log(this.name)
          }
        },
        // 定义当前页面的关联组件
        components: [
          {
            name: 'ExtendedButton',
            path: '@/components/button/button'
          }
        ],
        template: [
          '<v-extended-button></v-extended-button>'
        ].join("")
      })
    },
    h1(res, next, abort){
      console.log(res)
      setTimeout(() => {
        next([2, 'name'])
      },2000)
    },
    h2(res, next, abort){
      console.log(res)
      setTimeout(() => {
        console.log('over')
        next()
      },2000)
    },
    handleParams(){
      this.params = 1
      this.params = 3
    },
    changeSelect(newValue, oldValue){
      console.log('oldValue:' + oldValue)
      console.log('newValue:' + newValue)
    },
    interceptorBeforeChange(){
      return {
        valid: true,
        message: "我就是不让你改"
      }
    },
    confirmBeforeChange(option){
      console.log(this.value)
      console.log(option)
      return false
    }
  }
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
