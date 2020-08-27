const path = require('path')
let SearchPageGenerator = require(path.resolve(__dirname, '../generator/SearchPageGenerator.js'))

let pages = [
  {
    routeName: "searchPage",
    genTargetFolder: 'pages',
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
      {name: 'ExtendedButton', path: '@/components/button/button'}
    ],
    template: [
      '<v-extended-button></v-extended-button>'
    ].join("")
  },
  {
    routeName: "searchPage1",
    genTargetFolder: 'pages',
    fileName: 'b.vue',
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
      {name: 'ExtendedButton', path: '@/components/button/button'}
    ],
    template: [
      '<v-extended-button></v-extended-button>'
    ].join("")
  }
]

pages.forEach((page) => {
  new SearchPageGenerator(page)
})
