// reference https://github.com/noeldelgado/gemini-scrollbar/blob/master/index.js

import { addResizeListener, removeResizeListener } from 'element-ui/src/utils/resize-event';
import scrollbarWidth from 'element-ui/src/utils/scrollbar-width';
import { toObject } from 'element-ui/src/utils/util';
import Bar from './bar';

/* istanbul ignore next */
export default {
  name: 'ElScrollbar',

  components: { Bar },

  props: {
    native: Boolean,
    wrapStyle: {},
    wrapClass: {},
    viewClass: {},
    viewStyle: {},
    noresize: Boolean, // 如果 container 尺寸不会发生变化，最好设置它可以优化性能
    tag: {
      type: String,
      default: 'div'
    }
  },

  data() {
    return {
      sizeWidth: '0',
      sizeHeight: '0',
      moveX: 0,
      moveY: 0
    };
  },

  computed: {
    wrap() {
      return this.$refs.wrap;
    }
  },

  render(h) {
    let gutter = scrollbarWidth();
    let style = this.wrapStyle;

    if (gutter) {
      const gutterWith = `-${gutter}px`;
      const gutterStyle = `margin-bottom: ${gutterWith}; margin-right: ${gutterWith};`;

      if (Array.isArray(this.wrapStyle)) {
        style = toObject(this.wrapStyle);
        style.marginRight = style.marginBottom = gutterWith;
      } else if (typeof this.wrapStyle === 'string') {
        style += gutterStyle;
      } else {
        style = gutterStyle;
      }
    }
    const view = h(this.tag, {
      class: ['el-scrollbar__view', this.viewClass],
      style: this.viewStyle,
      ref: 'resize'
    }, this.$slots.default);
    let wrapClassList = {}
    if(typeof this.wrapClass == 'string'){
      wrapClassList[this.wrapClass] = true
    }else{
      wrapClassList = this.wrapClass
    }
    const wrap = h(
      'div',
      {
        ref: 'wrap',
        style: style,
        on: {
          scroll: (e) => {
            this.handleScroll(e)
          }
        },
        class: Object.assign({
          'el-scrollbar__wrap': true,
          'el-scrollbar__wrap--hidden-default': !!gutter,
        }, wrapClassList)
      },
      [view]
    )
    let nodes;

    if (!this.native) {
      let barHorizontal = h(
        'Bar',
        {
          attrs: {
            move: this.moveX,
            size: this.sizeWidth
          }
        }
      )
      let barVertical = h(
        'Bar',
        {
          attrs: {
            vertical: true,
            move: this.moveY,
            size: this.sizeHeight
          }
        }
      )
      nodes = [wrap, barHorizontal, barVertical];
    } else {
      let node = h(
        'div',
        {
          ref: 'wrap',
          class: Object.assign({
            'el-scrollbar__wrap': true,
          }, wrapClassList),
          style: style
        },
        [style]
      )
      nodes = [node];
    }
    return h('div', { class: 'el-scrollbar' }, nodes);
  },

  methods: {
    handleScroll() {
      const wrap = this.wrap;

      this.moveY = ((wrap.scrollTop * 100) / wrap.clientHeight);
      this.moveX = ((wrap.scrollLeft * 100) / wrap.clientWidth);
    },

    update() {
      let heightPercentage, widthPercentage;
      const wrap = this.wrap;
      if (!wrap) return;

      heightPercentage = (wrap.clientHeight * 100 / wrap.scrollHeight);
      widthPercentage = (wrap.clientWidth * 100 / wrap.scrollWidth);

      this.sizeHeight = (heightPercentage < 100) ? (heightPercentage + '%') : '';
      this.sizeWidth = (widthPercentage < 100) ? (widthPercentage + '%') : '';
    }
  },

  mounted() {
    if (this.native) return;
    this.$nextTick(this.update);
    !this.noresize && addResizeListener(this.$refs.resize, this.update);
  },

  beforeDestroy() {
    if (this.native) return;
    !this.noresize && removeResizeListener(this.$refs.resize, this.update);
  }
};
