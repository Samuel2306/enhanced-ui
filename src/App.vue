<template>
  <div id="app">
    <img src="./assets/logo.png">
    <h1>{{ msg }}</h1>
    <h2>Essential Links</h2>
    <extended-button :queue="[this.h1, this.h2]" :params="params" @handleParams="handleParams" type="primary"/>
    <extended-select
      multiple
      clearable
      :interceptorBeforeChange="interceptorBeforeChange"
      :confirmBeforeChange="confirmBeforeChange"
      v-model="value"
      @change="changeSelect">
      <extended-el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value">
      </extended-el-option>
    </extended-select>
    <ul>
      <li><a href="https://vuejs.org" target="_blank">Core Docs</a></li>
      <li><a href="https://forum.vuejs.org" target="_blank">Forum</a></li>
      <li><a href="https://chat.vuejs.org" target="_blank">Community Chat</a></li>
      <li><a href="https://twitter.com/vuejs" target="_blank">Twitter</a></li>
    </ul>
    <h2>Ecosystem</h2>
    <ul>
      <li><a href="http://router.vuejs.org/" target="_blank">vue-router</a></li>
      <li><a href="http://vuex.vuejs.org/" target="_blank">vuex</a></li>
      <li><a href="http://vue-loader.vuejs.org/" target="_blank">vue-loader</a></li>
      <li><a href="https://github.com/vuejs/awesome-vue" target="_blank">awesome-vue</a></li>
    </ul>
  </div>
</template>

<script>
  import Vue from 'vue'
  import Button from '@/components/button/ExtendedButton.vue'
  import Select from '@/components/select/select.vue'
  import ExtendedElOption from '@/components/select/option.vue'
  Vue.component("extended-button", Button)
  Vue.component("extended-select", Select)
  Vue.component("extended-el-option", ExtendedElOption)
export default {
  name: 'app',
  data () {
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
      value: ''
    }
  },
  methods: {
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
    changeSelect(oldValue, newValue){
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
