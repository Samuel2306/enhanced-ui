<template>
  <div
    class="el-select extended-select"
    :class="[selectSize ? 'el-select--' + selectSize : '']"
    @click.stop="toggleMenu"
    v-clickoutside="handleClose">

    <div
      class="el-select__tags"
      v-if="multiple"
      ref="tags"
      :style="{ 'max-width': inputWidth - 32 + 'px', width: '100%' }">
      <span v-if="collapseTags && selected.length">
        <el-tag
          :closable="!selectDisabled"
          :size="collapseTagSize"
          :hit="selected[0].hitState"
          type="info"
          @close="deleteTag($event, selected[0])"
          disable-transitions>
          <span class="el-select__tags-text">{{ selected[0].currentLabel }}</span>
        </el-tag>
        <el-tag
          v-if="selected.length > 1"
          :closable="false"
          :size="collapseTagSize"
          type="info"
          disable-transitions>
          <span class="el-select__tags-text">+ {{ selected.length - 1 }}</span>
        </el-tag>
      </span>
      <transition-group @after-leave="resetInputHeight" v-if="!collapseTags">
        <el-tag
          v-for="item in selected"
          :key="getValueKey(item)"
          :closable="!selectDisabled"
          :size="collapseTagSize"
          :hit="item.hitState"
          type="info"
          @close="deleteTag($event, item)"
          disable-transitions>
          <span class="el-select__tags-text">{{ item.currentLabel }}</span>
        </el-tag>
      </transition-group>

      <input
        type="text"
        class="el-select__input"
        :class="[selectSize ? `is-${ selectSize }` : '']"
        :disabled="selectDisabled"
        :autocomplete="autoComplete || autocomplete"
        @focus="handleFocus"
        @blur="softFocus = false"
        @keyup="managePlaceholder"
        @keydown="resetInputState"
        @keydown.down.prevent="navigateOptions('next')"
        @keydown.up.prevent="navigateOptions('prev')"
        @keydown.enter.prevent="selectOption"
        @keydown.esc.stop.prevent="visible = false"
        @keydown.delete="deletePrevTag"
        @keydown.tab="visible = false"
        @compositionstart="handleComposition"
        @compositionupdate="handleComposition"
        @compositionend="handleComposition"
        v-model="query"
        @input="debouncedQueryChange"
        v-if="filterable"
        :style="{ 'flex-grow': '1', width: inputLength / (inputWidth - 32) + '%', 'max-width': inputWidth - 42 + 'px' }"
        ref="input">
    </div>



    <!-- tabindex 属性规定元素的 tab 键控制次序 -->
    <el-input
      ref="reference"
      v-model="selectedLabel"
      type="text"
      :placeholder="currentPlaceholder"
      :name="name"
      :id="id"
      :autocomplete="autoComplete || autocomplete"
      :size="selectSize"
      :disabled="selectDisabled"
      :readonly="readonly"
      :validate-event="false"
      :class="{ 'is-focus': visible }"
      :tabindex="(multiple && filterable) ? '-1' : null"
      @focus="handleFocus"
      @blur="handleBlur"
      @keyup.native="debouncedOnInputChange"
      @keydown.native.down.stop.prevent="navigateOptions('next')"
      @keydown.native.up.stop.prevent="navigateOptions('prev')"
      @keydown.native.enter.prevent="selectOption"
      @keydown.native.esc.stop.prevent="visible = false"
      @keydown.native.tab="visible = false"
      @paste.native="debouncedOnInputChange"
      @mouseenter.native="inputHovering = true"
      @mouseleave.native="inputHovering = false">
      <!-- 定义input前置按钮 -->
      <template slot="prefix" v-if="$slots.prefix">
        <slot name="prefix"></slot>
      </template>
      <!-- 定义input后置按钮 -->
      <template slot="suffix">
        <i v-show="!showClose" :class="['el-select__caret', 'el-input__icon', 'el-icon-' + iconClass]"></i>
        <i v-if="showClose" class="el-select__caret el-input__icon el-icon-circle-close" @click="handleClearClick"></i>
      </template>
    </el-input>

    <transition
      name="el-zoom-in-top"
      @before-enter="handleMenuEnter"
      @after-leave="doDestroy">
      <el-select-menu
        ref="popper"
        :append-to-body="popperAppendToBody"
        v-show="visible && emptyText !== false">
        <el-scrollbar
          tag="ul"
          wrap-class="el-select-dropdown__wrap"
          view-class="el-select-dropdown__list"
          ref="scrollbar"
          :class="{ 'is-empty': !allowCreate && query && filteredOptionsCount === 0 }"
          v-show="options.length > 0 && !loading">
          <el-option
            :value="query"
            created
            v-if="showNewOption">
          </el-option>
          <slot></slot>
        </el-scrollbar>
        <template v-if="emptyText && (!allowCreate || loading || (allowCreate && options.length === 0 ))">
          <slot name="empty" v-if="$slots.empty"></slot>
          <p class="el-select-dropdown__empty" v-else>
            {{ emptyText }}
          </p>
        </template>
      </el-select-menu>
    </transition>
  </div>
</template>

<script>
  import Vue from 'vue'
  const isIE = function() {
    return !Vue.prototype.$isServer && !isNaN(Number(document.documentMode));
  };

  const isEdge = function() {
    return !Vue.prototype.$isServer && navigator.userAgent.indexOf('Edge') > -1;
  };
  // 比较两个值是否相等
  const valueEquals = (a, b) => {
    // see: https://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript
    if (a === b) return true;
    if (!(a instanceof Array)) return false;
    if (!(b instanceof Array)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i !== a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  const scrollIntoView = (container, selected) => {
    if (Vue.prototype.$isServer) return;

    if (!selected) {
      container.scrollTop = 0;
      return;
    }

    const offsetParents = [];
    let pointer = selected.offsetParent;
    while (pointer && container !== pointer && container.contains(pointer)) {
      offsetParents.push(pointer);
      pointer = pointer.offsetParent;
    }
    const top = selected.offsetTop + offsetParents.reduce((prev, curr) => (prev + curr.offsetTop), 0);
    const bottom = top + selected.offsetHeight;
    const viewRectTop = container.scrollTop;
    const viewRectBottom = viewRectTop + container.clientHeight;

    if (top < viewRectTop) {
      container.scrollTop = top;
    } else if (bottom > viewRectBottom) {
      container.scrollTop = bottom - container.clientHeight;
    }
  }
  import clickoutside from '@/directives/clickoutside';
  import NavigationMixin from '@/mixins/navigation-mixin';
  import Emitter from '@/mixins/emitter';
  import debounce from 'throttle-debounce/debounce';  // 节流
  import ElSelectMenu from './select-dropdown.vue';
  import ElOption from './option.vue';

  export default {
    name: "extended-select",
    mixins: [NavigationMixin, Emitter],
    data(){
      return {
        options: [],  // 选项集合
        visible: false,  // 用来控制下拉框的显示与隐藏
        selectedLabel: '',  // 选中的选项的label集合
        cachedPlaceHolder: '',
        currentPlaceholder: '',
        inputHovering: false,  // 用来标识鼠标是否移到input上面
        selected: this.multiple ? [] : {}, // 选中的所有元素的集合

        hoverIndex: -1,
        query: '',  // 查询字段
        optionsCount: 0,
        filteredOptionsCount: 0,
        softFocus: false,
        menuVisibleOnFocus: false,
      }
    },
    components: {
      ElSelectMenu,
      ElOption,
    },
    props: {
      name: String,   // 组件的name属性
      id: String,  // 组件的id属性
      value: {  // 这个属性对应v-model
        required: true
      },
      size: {  // 组件尺寸
        type: String,
        default: "small"
      },
      disabled: {  // 是否禁用
        type: Boolean,
        default: false
      },
      autocomplete: {
        type: String,
        default: 'off'
      },
      /** @Deprecated in next major version */
      autoComplete: {
        type: String,
        validator(val) {
          process.env.NODE_ENV !== 'production' &&
          console.warn('[Element Warn][Select]\'auto-complete\' property will be deprecated in next major version. please use \'autocomplete\' instead.');
          return true;
        }
      },
      filterable: Boolean,  // 是否可搜索，用来根据输入值筛选可选值
      remote: Boolean, // remote为真说明数据是远程请求回来的
      remoteMethod: Function,
      filterMethod: Function,
      multiple: Boolean,
      multipleLimit: {
        type: Number,
        default: 0
      },
      placeholder: {
        type: String,
        default: ''
      },
      popperAppendToBody: {  // 是否将弹出框插入至 body 元素。在弹出框的定位出现问题时，可将该属性设置为 false
        type: Boolean,
        default: true
      },
      allowCreate: Boolean, // 是否允许
      loading: Boolean,
      loadingText: String,
      automaticDropdown: Boolean,  // 对于不可搜索的 Select，是否在输入框获得焦点后自动弹出选项菜单
      collapseTags: Boolean,  // 是否折叠标签

      // el-select以外的自定义拦截器
      interceptPreChange: false, // 是否使用更改数据的前置拦截器
      preInterceptor: {
        type: Function
      },
    },
    computed: {
      selectSize(){
        return this.size
      },
      selectDisabled() {
        return this.disabled
      },
      readonly() {  // 是否只读
        // this.filterable：是否可搜索，可搜索时是允许在输入框输入的
        // this.multiple：是否支持多选
        return !this.filterable || this.multiple || (!isIE() && !isEdge() && !this.visible);
      },
      showClose() {  // 是否显示清除按钮
        let hasValue = this.multiple
          ? Array.isArray(this.value) && this.value.length > 0
          : this.value !== undefined && this.value !== null && this.value !== '';
        let criteria = this.clearable &&
          !this.selectDisabled &&
          this.inputHovering &&
          hasValue;
        return criteria;
      },
      iconClass() {
        return this.remote && this.filterable ? '' : (this.visible ? 'arrow-up is-reverse' : 'arrow-up');
      },
      emptyText() {
        if (this.loading) {
          return this.loadingText || this.t('el.select.loading');
        } else {
          if (this.remote && this.query === '' && this.options.length === 0) return false;
          if (this.filterable && this.query && this.options.length > 0 && this.filteredOptionsCount === 0) {
            return this.noMatchText || this.t('el.select.noMatch');
          }
          if (this.options.length === 0) {
            return this.noDataText || this.t('el.select.noData');
          }
        }
        return null;
      },
      showNewOption() {
        let hasExistingOption = this.options.filter(option => !option.created)
          .some(option => option.currentLabel === this.query);
        return this.filterable && this.allowCreate && this.query !== '' && !hasExistingOption;
      },
    },
    directives: { clickoutside },
    created() {
      this.cachedPlaceHolder = this.currentPlaceholder = this.placeholder;
      this.debouncedOnInputChange = debounce(this.debounce, () => {
        this.onInputChange();
      });
      this.debouncedQueryChange = debounce(this.debounce, (e) => {
        this.handleQueryChange(e.target.value);
      });
    },
    watch: {
      // 监听下拉框的可见状态的变化
      visible(val) {
        if (!val) {
          // 广播下拉框被销毁的事件
          this.broadcast('ElSelectDropdown', 'destroyPopper');
          if (this.$refs.input) {  // 让相应的输入框失去焦点
            this.$refs.input.blur();
          }
          this.query = '';  // 清空查询字符串
          this.previousQuery = null;
          this.selectedLabel = '';
          this.inputLength = 20;
          this.menuVisibleOnFocus = false;
          this.resetHoverIndex();
          this.$nextTick(() => {
            if (this.$refs.input &&
              this.$refs.input.value === '' &&
              this.selected.length === 0) {
              this.currentPlaceholder = this.cachedPlaceHolder;
            }
          });
          if (!this.multiple) {
            if (this.selected) {
              if (this.filterable && this.allowCreate &&
                this.createdSelected && this.createdLabel) {
                this.selectedLabel = this.createdLabel;
              } else {
                this.selectedLabel = this.selected.currentLabel;
              }
              if (this.filterable) this.query = this.selectedLabel;
            }

            if (this.filterable) {
              this.currentPlaceholder = this.cachedPlaceHolder;
            }
          }
        } else {
          this.broadcast('ElSelectDropdown', 'updatePopper');
          if (this.filterable) {
            this.query = this.remote ? '' : this.selectedLabel;
            this.handleQueryChange(this.query);
            if (this.multiple) {
              this.$refs.input.focus();
            } else {
              if (!this.remote) {
                this.broadcast('ElOption', 'queryChange', '');
                this.broadcast('ElOptionGroup', 'queryChange');
              }

              if (this.selectedLabel) {
                this.currentPlaceholder = this.selectedLabel;
                this.selectedLabel = '';
              }
            }
          }
        }
        this.$emit('visible-change', val);
      },
    },
    methods: {
      t(){

      },
      debounce() {
        return this.remote ? 300 : 0; // 数据是远程请求的，节流时间为300毫秒，数据是本地的，节流时间为0
      },
      handleClose() {
        // 关闭下拉框
        this.visible = false;
      },
      toggleMenu() {
        if (!this.selectDisabled) {
          if (this.menuVisibleOnFocus) {
            this.menuVisibleOnFocus = false;
          } else {
            this.visible = !this.visible;
          }
          if (this.visible) { // 当打开下拉框的时候让输入框自动获取焦点
            (this.$refs.input || this.$refs.reference).focus();
          }
        }
      },
      scrollToOption(option) {
        const target = Array.isArray(option) && option[0] ? option[0].$el : option.$el;
        if (this.$refs.popper && target) {
          const menu = this.$refs.popper.$el.querySelector('.el-select-dropdown__wrap');
          scrollIntoView(menu, target);
        }
        this.$refs.scrollbar && this.$refs.scrollbar.handleScroll();
      },
      resetHoverIndex() {
        setTimeout(() => {
          if (!this.multiple) {
            this.hoverIndex = this.options.indexOf(this.selected);
          } else {
            if (this.selected.length > 0) {
              this.hoverIndex = Math.min.apply(null, this.selected.map(item => this.options.indexOf(item)));
            } else {
              this.hoverIndex = -1;
            }
          }
        }, 300);
      },
      handleFocus(){
        if (!this.softFocus) {
          // this.automaticDropdown：对于不可搜索的 Select，是否在输入框获得焦点后自动弹出选项菜单
          if (this.automaticDropdown || this.filterable) {
            this.visible = true;
            if (this.filterable) {
              // 当select组件是带筛选功能的时，打开下拉框时需要让输入框自动获取焦点
              this.menuVisibleOnFocus = true;
            }
          }
          this.$emit('focus', event);
        } else {
          this.softFocus = false;
        }
      },
      handleBlur(){

      },
      onInputChange(){

      },
      handleQueryChange(){

      },
      selectOption() {
        // 当下拉框本身不可见时，直接打开下拉框
        if (!this.visible) {
          this.toggleMenu();
        } else {
          // 选中hoverIndex对应的下拉框
          if (this.options[this.hoverIndex]) {
            this.handleOptionSelect(this.options[this.hoverIndex]);
          }
        }
      },
      handleClearClick(event) {
        this.deleteSelected(event);
      },
      deleteSelected(event) {
        event.stopPropagation();
        this.emitInputAndChange(this.multiple ? [] : '');
        this.$emit('clear');
      },
      async emitInputAndChange(val) {
        if(this.preInterceptor){
          let res = await this.preInterceptor(this.value, val, context)
          if(!res){
            return
          }
        }
        // let oldValue = Array.isArray(this.value) ? this.value.slice(0) : this.value
        this.$emit('input', this.value, val);  // input事件是v-model的一部分，触发input事件就是将val值赋值到this.value上面
        if (!valueEquals(this.value, val)) {
          this.$emit('change', this.value, val);
        }
        this.visible = false
      },

      // 在下拉框打开的时候自动滚动到选中元素对应的位置
      handleMenuEnter() {
        this.$nextTick(() => this.scrollToOption(this.selected));
      },
      // 执行下拉框的销毁动作
      doDestroy() {
        this.$refs.popper && this.$refs.popper.doDestroy();
      },
    }
  }
</script>

<style lang="scss">

</style>
