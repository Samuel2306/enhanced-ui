<template>
  <el-button class="mood" @click="clickBtn" :loading="state">{{btnText || text}}</el-button>
</template>
<script>
  export default {
    name: "extended-button",
    template: '',
    props: {
      queue: {
        type: Array,
        default: function(){
          return []
        }
      },
      params: {
        type: Object,
        default: function(){
          return {}
        }
      },
      formatterParams: {
        type: Function
      },
      requestType: {
        type: String,
        default: 'queue'  // queue 串行  parallel 并行
      },
      btnText: {
        type: String
      }
    },
    data(){
      return {
        state: false,
        text: "按钮"
      }
    },
    methods: {
      async runQueue(){ // params：传给list中第一个promise对象的参数
        if(!this.queue.length){
          return
        }
        let params
        try{
          params = this.formatterParams ? await this.formatterParams.apply(this.$parent) : (this.params ? this.params : {})
        }catch(e){
          console.error(e)
          this.toggleState(false)
          return
        }

        let p = Promise.resolve(params);
        if(this.requestType == 'queue'){
          p = this.queue.reduce((origin, item) => {
            return origin.then(function(res){// res是上一个promise对象传过来的结果
              return new Promise(async (resolve, reject) => {
                try{
                  if(res != undefined){
                    await item(res, resolve, reject)
                  }else{
                    await item(resolve, reject)
                  }
                }catch (e) {
                  reject(e)
                }
              })
            });
          }, p)
          p.finally(() => {
            this.toggleState(false)
          })
        }else{
          p.then(function(res){
            let promiseArr = []
            this.queue.forEach((item) => {
              promiseArr.push(new Promise(async (resolve, reject) => {
                try{
                  if(res != undefined){
                    await item(res, resolve, reject)
                  }else{
                    await item(resolve, reject)
                  }
                }catch (e) {
                  reject(e)
                }
              }))
            })
            Promise.all(promiseArr)
              .finally(() => {
                this.toggleState(false)
              })
          })
        }
      },
      toggleState(bool) {
        this.state = bool != undefined ? bool : !this.state
      },
      clickBtn(){
        if(!this.state && this.queue.length){
          this.$emit('click')
          this.toggleState(true)
          this.runQueue()
        }
      }
    },
  }
</script>
<style lang="scss">

</style>
