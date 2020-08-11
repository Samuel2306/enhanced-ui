<template>
  <el-button class="mood" @click="clickBtn" :loading="state">
    {{text}}
  </el-button>
</template>

<script>
  export default {
    name: "ExtendedButton",
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
            return origin.then((res) => {// res是上一个promise对象传过来的结果
              return new Promise(async (resolve, reject) => {
                try{
                  await item(params, resolve, reject)
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
          p.then((params) => {
            let promiseArr = []
            this.queue.forEach((item) => {
              promiseArr.push(new Promise(async (resolve, reject) => {
                try{
                  await item(params, resolve, reject)
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
        if(!this.state){
          this.$emit('click')
          this.toggleState(true)
          this.runQueue()
        }
      }
    },
  }
</script>

<style lang="scss" scoped>

</style>
