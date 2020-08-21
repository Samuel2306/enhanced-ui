<template>
  <el-button
    class="mood"
    :class="{'noLoadingIcon': !showLoadingIcon}"
    :type="type"
    :plain="plain"
    :round="round"
    :circle="circle"
    :disabled="disabled"
    :size="size"
    :autofocus="autofocus"
    :native-type="nativeType"
    @click="clickBtn"
    :loading="state">
    {{btnText || text}}
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
      params: {},
      requestType: {
        type: String,
        default: 'queue'  // queue 串行  parallel 并行
      },
      btnText: {
        type: String
      },
      type: {
        type: String,
        default: 'default'
      },
      plain: {
        type: Boolean,
        default: false
      },
      round: {
        type: Boolean,
        default: false
      },
      circle: {
        type: Boolean,
        default: false
      },
      icon: {
        type: String
      },
      disabled: {
        type: Boolean
      },
      size: {
        type: String   // medium、small、mini
      },
      autofocus: {
        type: Boolean,
        default: false
      },
      nativeType: {
        type: String,
        default: 'button'
      },
      showLoadingIcon: {
        type: Boolean,
        default: true
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
        if(!this.queue.length || this.disabled){
          return
        }
        let params
        try{
          params = this.params != undefined ? this.params : {}
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
        if(this.disabled){
          return
        }
        this.state = bool != undefined ? bool : !this.state
      },
      clickBtn(){
        if(!this.state && !this.disabled){
          this.$emit('click')
          if(this.queue.length){
            this.$emit('handleParams')
            this.$nextTick(() => {
              this.toggleState(true)
              this.runQueue()
            })
          }
        }
      }
    },
  }
</script>
<style lang="scss">
  .el-button{
    &.noLoadingIcon {
      .el-icon-loading{
        display: none !important;
        & + span{
          margin-left: 0 !important;
        }
      }
    }
  }
</style>
