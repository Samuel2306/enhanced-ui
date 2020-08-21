<template>
  <div
    class="el-select"
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
      <!-- 底下这个input很重要，是用来使用搜索功能的，而且宽度是自动变化的  给外层div设置display:flex, 给这个input设置flex-grow: 1-->
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
      <template slot="prefix" v-if="$slots.prefix">
        <slot name="prefix"></slot>
      </template>
      <template slot="suffix">
        <i v-show="!showClose" :class="['el-select__caret', 'el-input__icon', 'el-icon-' + iconClass]"></i>
        <i v-if="showClose" class="el-select__caret el-input__icon el-icon-circle-close" @click="handleClearClick"></i>
      </template>
    </el-input>
    <transition
      name="el-zoom-in-top"
      @before-enter="handleMenuEnter"
      @after-leave="doDestroy">
      <extended-el-select-menu
        ref="popper"
        :append-to-body="popperAppendToBody"
        v-show="visible && emptyText !== false">
        <extended-el-scrollbar
          tag="ul"
          wrap-class="el-select-dropdown__wrap"
          view-class="el-select-dropdown__list"
          ref="scrollbar"
          :class="{ 'is-empty': !allowCreate && query && filteredOptionsCount === 0 }"
          v-show="options.length > 0 && !loading">
          <!-- 以下这个option是用来创建用户自定义的选项的 -->
          <extended-el-option
            :value="query"
            created
            v-if="showNewOption">
          </extended-el-option>
          <slot></slot>
        </extended-el-scrollbar>
        <template v-if="emptyText && (!allowCreate || loading || (allowCreate && options.length === 0 ))">
          <slot name="empty" v-if="$slots.empty"></slot>
          <p class="el-select-dropdown__empty" v-else>
            {{ emptyText }}
          </p>
        </template>
      </extended-el-select-menu>
    </transition>
  </div>
</template>

<script type="text/babel">
  import Emitter from '../../mixins/emitter';
  import Focus from '../../mixins/focus';
  import Locale from '../../mixins/locale';
  import ExtendedElSelectMenu from './select-dropdown.vue';
  import ExtendedElOption from './option.vue';
  import ExtendedElOptionGroup from './option-group.vue';
  import ExtendedElScrollbar from '../scrollbar';
  import debounce from 'throttle-debounce/debounce';
  import Clickoutside from '../../utils/clickoutside';
  import { addResizeListener, removeResizeListener } from '../../utils/resize-event';
  import { t } from '../../locale';
  import scrollIntoView from '../../utils/scroll-into-view';
  import { getValueByPath, valueEquals, isIE, isEdge } from '../../utils/util';
  import NavigationMixin from './navigation-mixin';
  import { isKorean } from '../../utils/shared';

  export default {
    mixins: [Emitter, Locale, Focus('reference'), NavigationMixin],

    name: 'ExtendedElSelect',

    componentName: 'ExtendedElSelect',

    inject: {
      elForm: {
        default: ''
      },

      elFormItem: {
        default: ''
      }
    },

    provide() {
      return {
        'select': this
      };
    },

    computed: {
      _elFormItemSize() {
        return (this.elFormItem || {}).elFormItemSize;
      },

      readonly() {
        return !this.filterable || this.multiple || (!isIE() && !isEdge() && !this.visible);
      },

      showClose() {
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

      debounce() {
        return this.remote ? 300 : 0;
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
        // 用来控制用户可自定义的选项是否显示，当匹配到相应的选项时，用户自定义的选项就不会显示
        let hasExistingOption = this.options.filter(option => !option.created)
          .some((option) => {
            return option.currentLabel === this.query;
          });
        return this.filterable && this.allowCreate && this.query !== '' && !hasExistingOption;
      },

      selectSize() {
        return this.size || this._elFormItemSize || (this.$ELEMENT || {}).size;
      },

      selectDisabled() {
        return this.disabled || (this.elForm || {}).disabled;
      },

      collapseTagSize() {
        return ['small', 'mini'].indexOf(this.selectSize) > -1
          ? 'mini'
          : 'small';
      }
    },

    components: {
      ExtendedElSelectMenu,
      ExtendedElOption,
      ExtendedElScrollbar,
      ExtendedElOptionGroup
    },

    directives: { Clickoutside },

    props: {
      name: String,
      id: String,
      value: {
        required: true,
        type: String | Number | Array
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
      automaticDropdown: Boolean,
      size: String,
      disabled: Boolean,
      clearable: Boolean,
      filterable: Boolean,
      allowCreate: Boolean,
      loading: Boolean,
      popperClass: String,
      remote: Boolean,
      loadingText: String,
      noMatchText: String,
      noDataText: String,
      remoteMethod: Function,
      filterMethod: Function,
      multiple: Boolean,
      multipleLimit: {
        type: Number,
        default: 0
      },
      placeholder: {
        type: String,
        default() {
          return t('el.select.placeholder');
        }
      },
      defaultFirstOption: Boolean,
      reserveKeyword: Boolean,
      // 当选项数据的value值是一个对象时，valueKey属性可以控制应该取对象的哪个属性作为该选项的值
      valueKey: {
        type: String,
        default: 'value'
      },
      collapseTags: Boolean,
      popperAppendToBody: {
        type: Boolean,
        default: true
      },
      confirmBeforeChange: { // 是否在选中项发生改变时进行确认
        type: Boolean | Function
      },
      confirmChangeText: {
        type: String,
        default: "确认要修改吗？"
      },
      confirmChangeTitle: {
        type: String,
        default: "提示"
      },
      // 值改变之前的拦截器, 主要是为了拦截非法的值改变
      // 可以直接返回一个对象，也可以返回一个promise对象（用来处理异步验证），promise对象最后返回的也要符合以下数据格式
      interceptorBeforeChange: {
        type: Function,
        default: function(){
          return {
            valid: true,
            message: "修改不合法" // 该属性可以是主要用来调用element-ui的message组件，可以只传入需要提示的文字，也可以是整个配置对象
          }
        }
      }
    },

    data() {
      return {
        options: [],
        cachedOptions: [], // 缓存最初传入的option实例列表
        createdLabel: null,
        createdSelected: false,
        // selected表示已选中选项的对象，这个属性用在多选的情况下
        selected: this.multiple ? [] : {},
        inputLength: 20,
        inputWidth: 0,
        initialInputHeight: 0,
        cachedPlaceHolder: '', // 备份初始的placeholder
        optionsCount: 0,
        filteredOptionsCount: 0,
        visible: false,
        softFocus: false,
        // selectedLabel表示已选中选项的文字，这个属性用在单选的情况下
        selectedLabel: '',
        // 标识options中哪一个位置的option处于待选状态，刚打开时待选option跟当前选中的option一般是同一个，但是可以通过键盘上的上下健更改待选项
        // 当hoverIndex的值不是-1时，点击会车按钮就会选中hoverIndex对应的option
        hoverIndex: -1,
        query: '',
        previousQuery: null,
        inputHovering: false,
        // 动态变化的placeholder，为什么需要这个呢？会有这样一种场景，在一个可搜索的select中，已选中一个选项，此时我点击搜索框进行搜索，
        // 在未输入任何内容之前，可以通过placeholder看到我当前选中选项的文案
        currentPlaceholder: '',
        // menuVisibleOnFocus这个元素的作用是什么呢？
        // 当我们通过点击组件，会让输入框获取焦点 => 调用handleFocus方法(在方法内部会将visible置为true)，但是这时候最外层的toggleMenu方法也会被调用
        // toggleMenu这个方法是将visible设置为!visible, 主要是为了实现（点一下打开，点一下关闭下拉框的功能）
        // 那么为什么需要handleFocus中也去设置visible的值呢，主要是为了配合键盘操作，当使用tab健使输入框获取焦点的时候也需要打开下拉框
        menuVisibleOnFocus: false,
        isOnComposition: false,
        isSilentBlur: false // 当我们选择选项的时候，其实也是会触发输入框的blur事件的，但是这中blur事件我们可以选择不向外传递
      };
    },

    watch: {
      selectDisabled() {
        this.$nextTick(() => {
          this.resetInputHeight();
        });
      },

      placeholder(val) {
        this.cachedPlaceHolder = this.currentPlaceholder = val;
      },

      value(val, oldVal) {
        if (this.multiple) {
          this.resetInputHeight();
          if ((val && val.length > 0) || (this.$refs.input && this.query !== '')) {
            this.currentPlaceholder = '';
          } else {
            this.currentPlaceholder = this.cachedPlaceHolder;
          }
          if (this.filterable && !this.reserveKeyword) {
            this.query = '';
            this.handleQueryChange(this.query);
          }
        }
        this.setSelected();
        if (this.filterable && !this.multiple) {
          this.inputLength = 20;
        }
        if (!valueEquals(val, oldVal)) {
          this.dispatch('ElFormItem', 'el.form.change', val);
        }
      },

      visible(val) {
        // console.log('visible：' + val);
        if (!val) {
          this.broadcast('ExtendedElSelectDropdown', 'destroyPopper');
          if (this.$refs.input) {
            this.$refs.input.blur();
          }
          this.query = '';
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
          this.broadcast('ExtendedElSelectDropdown', 'updatePopper');
          if (this.filterable) {
            this.query = this.remote ? '' : this.selectedLabel;
            this.handleQueryChange(this.query);
            if (this.multiple) {
              this.$refs.input.focus();
            } else {
              if (!this.remote) {
                this.broadcast('ExtendedElOption', 'queryChange', '');
                this.broadcast('ExtendedElOptionGroup', 'queryChange');
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

      options() {
        if (this.$isServer) return;
        this.$nextTick(() => {
          this.broadcast('ExtendedElSelectDropdown', 'updatePopper');
        });
        if (this.multiple) {
          this.resetInputHeight();
        }
        let inputs = this.$el.querySelectorAll('input');
        if ([].indexOf.call(inputs, document.activeElement) === -1) {
          this.setSelected();
        }
        // defaultFirstOption：在输入框按下回车，选择第一个匹配项，需配合 filterable 或 remote 使用
        if (this.defaultFirstOption && (this.filterable || this.remote) && this.filteredOptionsCount) {
          this.checkDefaultFirstOption();
        }
      }
    },

    methods: {
      // 处理composition事件
      handleComposition(event) {
        const text = event.target.value;
        // https://www.jianshu.com/p/5c7883df9d86  composition事件详解
        if (event.type === 'compositionend') {
          this.isOnComposition = false;
          this.$nextTick(_ => this.handleQueryChange(text));
        } else {
          const lastCharacter = text[text.length - 1] || '';
          this.isOnComposition = !isKorean(lastCharacter);
        }
      },
      // 当select设置为可搜索时，搜索关键字发生变化时就会调用该函数
      handleQueryChange(val) {
        // this.isOnComposition表示正在输入中文拼音（中文在键盘上并没有，我们在输入中文的时候，除非我们选中中文，不然就算输入也不应该触发搜索）
        if (this.previousQuery === val || this.isOnComposition) return;

        // 当第一次执行搜素时，只进行赋值操作
        if (this.previousQuery === null && (typeof this.filterMethod === 'function' || typeof this.remoteMethod === 'function')) {
          this.previousQuery = val;
          return;
        }
        this.previousQuery = val;
        this.$nextTick(() => { // 触发updatePopper事件
          if (this.visible) this.broadcast('ExtendedElSelectDropdown', 'updatePopper');
        });
        this.hoverIndex = -1;
        // 多选且可搜索的情况下
        if (this.multiple && this.filterable) {
          this.$nextTick(() => {
            /* 计算搜索框的宽度 */
            const length = this.$refs.input.value.length * 15 + 20; // 在文字宽度的基础上添加20px的padding
            this.inputLength = this.collapseTags ? Math.min(50, length) : length; // 当this.collapseTags为假，说明标签不折叠，则输入框宽度就是length。否则，最宽为50
            /* 计算搜索框的宽度 */
            this.managePlaceholder();
            this.resetInputHeight();
          });
        }
        if (this.remote && typeof this.remoteMethod === 'function') {
          this.hoverIndex = -1;
          this.remoteMethod(val);
        } else if (typeof this.filterMethod === 'function') {
          this.filterMethod(val);
          this.broadcast('ExtendedElOptionGroup', 'queryChange');
        } else {
          this.filteredOptionsCount = this.optionsCount;
          this.broadcast('ExtendedElOption', 'queryChange', val);
          this.broadcast('ExtendedElOptionGroup', 'queryChange');
        }
        // defaultFirstOption：在输入框按下回车，选择第一个匹配项，需配合 filterable 或 remote 使用
        if (this.defaultFirstOption && (this.filterable || this.remote) && this.filteredOptionsCount) {
          this.checkDefaultFirstOption();
        }
      },

      scrollToOption(option) {
        // 如果option是数组，target就是option中第一个元素对应的dom元素
        const target = Array.isArray(option) && option[0] ? option[0].$el : option.$el;
        if (this.$refs.popper && target) {
          // 获取包裹选项列表ul的父级元素，menu元素高度是固定的，ul的高度随着元素的多自定变化
          const menu = this.$refs.popper.$el.querySelector('.el-select-dropdown__wrap');
          scrollIntoView(menu, target);
        }
        // 记录滚动的距离相对于包裹元素高度的百分比, 暂时不知道什么作用
        this.$refs.scrollbar && this.$refs.scrollbar.handleScroll();
      },

      // 下拉框动画执行之前，先讲选项列表滚动到选中项的位置
      handleMenuEnter() {
        this.$nextTick(() => this.scrollToOption(this.selected));
      },
      // 新旧值不同时乘触发change事件
      emitChange(val) {
        if (!valueEquals(this.value, val)) {
          this.$emit('change', val, this.value);
        }
      },
      // 根据value 值获取对应option的数据对象
      getOption(value) {
        let option;
        const isObject = Object.prototype.toString.call(value).toLowerCase() === '[object object]';
        const isNull = Object.prototype.toString.call(value).toLowerCase() === '[object null]';
        const isUndefined = Object.prototype.toString.call(value).toLowerCase() === '[object undefined]';

        for (let i = this.cachedOptions.length - 1; i >= 0; i--) {
          const cachedOption = this.cachedOptions[i];
          const isEqual = isObject ? getValueByPath(cachedOption.value, this.valueKey) === getValueByPath(value, this.valueKey) : cachedOption.value === value;
          if (isEqual) {
            option = cachedOption;
            break;
          }
        }
        if (option) return option;
        // option为假说明，是用户自己创建的选项
        const label = (!isObject && !isNull && !isUndefined) ? value : '';
        let newOption = {
          value: value,
          currentLabel: label
        };
        if (this.multiple) {
          // hitState用来控制用户自定义的选项是否有边框描边
          newOption.hitState = false;
        }
        return newOption;
      },

      // 设置选中的值
      setSelected() {
        if (!this.multiple) {
          let option = this.getOption(this.value);
          if (option.created) { // 用户自定义的选项
            // currentLabel属性就是label属性
            this.createdLabel = option.currentLabel;
            this.createdSelected = true;
          } else {
            this.createdSelected = false;
          }
          this.selectedLabel = option.currentLabel;
          this.selected = option;
          if (this.filterable) this.query = this.selectedLabel;
          return;
        }
        let result = [];
        if (Array.isArray(this.value)) {
          this.value.forEach(value => {
            result.push(this.getOption(value));
          });
        }
        this.selected = result;
        this.$nextTick(() => {
          this.resetInputHeight();
        });
      },
      // 处理input获取焦点
      handleFocus(event) {
        // console.log('handleFocus');
        if (!this.softFocus) {
          // automaticDropdown：对于不可搜索的 Select，是否在输入框获得焦点后自动弹出选项菜单，默认值为false
          if (this.automaticDropdown || this.filterable) {
            this.visible = true;
            if (this.filterable) {
              this.menuVisibleOnFocus = true;
              // console.log('handleFocus menuVisibleOnFocus：' + this.menuVisibleOnFocus);
            }
          }
          this.$emit('focus', event);
        } else {
          this.softFocus = false;
        }
      },
      // 处理失焦
      blur() {
        this.visible = false;
        this.$refs.reference.blur();
      },

      handleBlur(event) {
        this.$nextTick(() => {})
        setTimeout(() => {
          if (this.isSilentBlur) {
            this.isSilentBlur = false;
          } else {
            this.$emit('blur', event);
          }
        }, 200); // 延长到200毫秒时可以连第一次点击都不触发blur事件
        this.softFocus = false;
      },
      // 清除所有选中的选项，本人认为可添加删除确认
      handleClearClick(event) {
        this.deleteSelected(event);
      },
      // 销毁popper
      doDestroy() {
        this.$refs.popper && this.$refs.popper.doDestroy();
      },
      // 关闭下拉框
      handleClose() {
        this.visible = false;
      },
      // 更改tag的hitState， hitState为真时，tag就会有一个加粗的边框
      toggleLastOptionHitState(hit) {
        if (!Array.isArray(this.selected)) return;
        const option = this.selected[this.selected.length - 1];
        if (!option) return;

        if (hit === true || hit === false) {
          option.hitState = hit;
          return hit;
        }

        option.hitState = !option.hitState;
        return option.hitState;
      },
      // hitState为真时，tag就会有一个加粗的边框，这种情况出现在最后一个tag，这时候使用delete按键将其删除
      async deletePrevTag(e) {
        let res
        res = await this.handleAction(this.getOption(this.value[this.value.length - 1]))
        if(!res){
          return
        }

        if (e.target.value.length <= 0 && !this.toggleLastOptionHitState()) {
          const value = this.value.slice();
          value.pop();
          this.$emit('input', value);
          this.emitChange(value);
        }
      },
      // 动态设置placeholder的值
      managePlaceholder() {
        if (this.currentPlaceholder !== '') {
          this.currentPlaceholder = this.$refs.input.value ? '' : this.cachedPlaceHolder;
        }
      },

      resetInputState(e) {
        if (e.keyCode !== 8) this.toggleLastOptionHitState(false);
        this.inputLength = this.$refs.input.value.length * 15 + 20;
        this.resetInputHeight();
      },
      // 重新调整reference对应输入框的高度
      resetInputHeight() {
        // 当不可搜索且标签会折叠时，不调整输入框的高度
        if (this.collapseTags && !this.filterable) return;
        this.$nextTick(() => {
          if (!this.$refs.reference) return;
          let inputChildNodes = this.$refs.reference.$el.childNodes;
          let input = [].filter.call(inputChildNodes, item => item.tagName === 'INPUT')[0];
          const tags = this.$refs.tags;
          const sizeInMap = this.initialInputHeight || 40;
          input.style.height = this.selected.length === 0
            ? sizeInMap + 'px'
            : Math.max(tags ? (tags.clientHeight + (tags.clientHeight > sizeInMap ? 6 : 0)) : 0, sizeInMap) + 'px'; // (tags.clientHeight > sizeInMap ? 6 : 0) 这个应该是加个padding的作用
          // 如果显示下拉框，且有相应的选项，更新popper
          if (this.visible && this.emptyText !== false) {
            this.broadcast('ExtendedElSelectDropdown', 'updatePopper');
          }
        });
      },
      // 重置hoverIndex属性
      resetHoverIndex() {
        setTimeout(() => {
          if (!this.multiple) {
            this.hoverIndex = this.options.indexOf(this.selected);
          } else { // 多选时选择索引最小的那一个
            if (this.selected.length > 0) {
              this.hoverIndex = Math.min.apply(null, this.selected.map(item => this.options.indexOf(item)));
            } else {
              this.hoverIndex = -1;
            }
          }
        }, 300);
      },
      async confirmChange(resolve, reject, option){
        let flag
        try{
          // option是option组件实例或者一个包含value属性的对象，option.value == "deleteAll" 说明是删除所有选项
          // option指向本次操作对应的对象
          flag = typeof this.confirmBeforeChange != 'function' ? !!this.confirmBeforeChange : await this.confirmBeforeChange(option)
        }catch(e){
          flag = false
        }
        // flag为真说明需要确认
        if(flag){
          this.$confirm(this.confirmChangeText, this.confirmChangeTitle, {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(async () => {
            // 确认修改一下还要进行数据验证,valid是一个对象
            let valid
            try {
              valid = await this.interceptorBeforeChange()
            }catch(e){
              valid = e
            }
            if(!valid.valid){
              let msg = typeof valid.message == 'string' ? {type: 'warning', message: valid.message} : valid.message
              this.$message(msg);
            }
            resolve(valid.valid)
          }).catch(() => {
            resolve(false)
          });
        }else{
          resolve(true)
        }
      },
      // 处理任何会导致值发生改变的行为
      async handleAction(option){
        return new Promise((resolve, reject) => {
          this.confirmChange(resolve, reject, option)
        })
      },
      /**
       * 处理选中选项事件的函数
       * @param option：选项的组件事例
       * @param byClick: 是否是点击选中的
       */
      async handleOptionSelect(option, byClick) {
        let res
        res = await this.handleAction(this.getOption(option.value))
        if(!res){
          return
        }
        if (this.multiple) {
          const value = (this.value || []).slice();
          // 获取当前option在已选数据中的位置
          const optionIndex = this.getValueIndex(value, option.value);
          if (optionIndex > -1) {
            // 当该选型已经存在时，再执行handleOptionSelect其实就是取消选中
            value.splice(optionIndex, 1);
          } else if (this.multipleLimit <= 0 || value.length < this.multipleLimit) {
            // multipleLimit为0表示不做任何限制
            value.push(option.value);
          }
          // 更新父组件绑定在该组件上面的值
          this.$emit('input', value);
          this.emitChange(value);
          // option.created为真说明这是用户自己创建的条目,选中该条目以后要清除搜索字段,并自动再进行一次全量搜索
          if (option.created) {
            this.query = '';
            this.handleQueryChange('');
            this.inputLength = 20;
          }
          // 如果可搜索让专门用来搜索的输入框自动获取焦点
          if (this.filterable) this.$refs.input.focus();
        } else {
          // 更新外层组件绑定在select组件上属性的值
          this.$emit('input', option.value);
          // 触发change事件
          this.emitChange(option.value);
          // 关闭下拉框
          this.visible = false;
        }
        this.isSilentBlur = byClick;
        this.setSoftFocus();
        // 如果下拉框本身就是可见状态就不继续往下
        if (this.visible) return;
        this.$nextTick(() => {
          // 滚动到option对应的位置
          this.scrollToOption(option);
        });
      },
      // 让输入框获取焦点
      setSoftFocus() {
        this.softFocus = true;
        const input = this.$refs.input || this.$refs.reference;
        if (input) {
          input.focus();
        }
      },

      // 根据value值获取对应option的索引
      getValueIndex(arr = [], value) {
        // value是不是对象，处理方式不一样
        const isObject = Object.prototype.toString.call(value).toLowerCase() === '[object object]';
        if (!isObject) {
          return arr.indexOf(value);
        } else {
          const valueKey = this.valueKey;
          let index = -1;
          arr.some((item, i) => {
            // getValueByPath可以获取对象中任意层级的属性值，换句话说valueKey可以是"params.name"这种形式
            if (getValueByPath(item, valueKey) === getValueByPath(value, valueKey)) {
              index = i;
              return true;
            }
            return false;
          });
          return index;
        }
      },
      // 打开或关闭下拉框
      toggleMenu() {
        // console.log('toggleMenu');
        // console.log('toggleMenu menuVisibleOnFocus：' + this.menuVisibleOnFocus);
        if (!this.selectDisabled) {
          if (this.menuVisibleOnFocus) {
            this.menuVisibleOnFocus = false;
            // console.log('toggleMenu menuVisibleOnFocus：' + this.menuVisibleOnFocus);
          } else {
            this.visible = !this.visible;
          }
          // 如果是打开选项下拉框就让输入框元素获取焦点
          if (this.visible) {
            (this.$refs.input || this.$refs.reference).focus();
          }
        }
      },

      // 按下回车键选择相应的选项
      selectOption() {
        if (!this.visible) {
          this.toggleMenu();
        } else {
          if (this.options[this.hoverIndex]) {
            this.handleOptionSelect(this.options[this.hoverIndex]);
          }
        }
      },
      // 清除所有选中的选项，个人觉得能把所有清除的值一起返回
      async deleteSelected(event) {
        let res
        res = await this.handleAction({value: "deleteAll"})
        if(!res){
          return
        }

        event.stopPropagation();
        const value = this.multiple ? [] : '';
        this.$emit('input', value);
        this.emitChange(value);
        this.visible = false;
        this.$emit('clear');
      },
      // 删除某个tag
      async deleteTag(event, tag) {
        let res
        res = await this.handleAction(this.getOption(this.value[this.selected.indexOf(tag)]))
        if(!res){
          return
        }

        let index = this.selected.indexOf(tag);
        if (index > -1 && !this.selectDisabled) {
          const value = this.value.slice();
          value.splice(index, 1);
          this.$emit('input', value);
          this.emitChange(value);
          // 还会触发remove-tag事件
          this.$emit('remove-tag', tag.value);
        }
        event.stopPropagation();
      },
      // el-input元素的值发挥变化时触发
      onInputChange() {
        if (this.filterable && this.query !== this.selectedLabel) {
          this.query = this.selectedLabel;
          this.handleQueryChange(this.query);
        }
      },

      // 销毁option组件事例
      onOptionDestroy(index) {
        if (index > -1) {
          this.optionsCount--;
          this.filteredOptionsCount--;
          this.options.splice(index, 1);
        }
      },

      // 将ei-input元素的宽度设置到inputWidth属性上，主要是为了定义popper的位置
      resetInputWidth() {
        this.inputWidth = this.$refs.reference.$el.getBoundingClientRect().width;
      },

      // 重新设置ei-input元素的宽和高
      handleResize() {
        this.resetInputWidth();
        if (this.multiple) this.resetInputHeight();
      },

      // 默认选中第一个选项，其实就是计算hoverIndex的值，hoverIndex对应的option就可以通过回车键选中
      checkDefaultFirstOption() {
        this.hoverIndex = -1;
        // 如果是创建的选项就将创建项的索引设置为hoverIndex，一般创建项的索引就是this.options.length
        let hasCreated = false;
        for (let i = this.options.length - 1; i >= 0; i--) {
          if (this.options[i].created) {
            hasCreated = true;
            this.hoverIndex = i;
            break;
          }
        }
        if (hasCreated) return;
        for (let i = 0; i !== this.options.length; ++i) {
          const option = this.options[i];
          // 如果存在搜索关键字就将hoverIndex设置为关键字匹配的option的索引，否则就将hoverIndex设置为选中项的索引值
          if (this.query) {
            if (!option.disabled && !option.groupDisabled && option.visible) {
              this.hoverIndex = i;
              break;
            }
          } else {
            if (option.itemSelected) {
              this.hoverIndex = i;
              break;
            }
          }
        }
      },

      // 获取选项的value值
      getValueKey(item) {
        if (Object.prototype.toString.call(item.value).toLowerCase() !== '[object object]') {
          return item.value;
        } else {
          return getValueByPath(item.value, this.valueKey);
        }
      }
    },

    created() {
      // 将placeholder的值同步到currentPlaceholder和cachedPlaceHolder
      this.cachedPlaceHolder = this.currentPlaceholder = this.placeholder;
      // 组件创建的时候会自动触发一次input事件，这跟v-model指令有关系
      if (this.multiple && !Array.isArray(this.value)) {
        this.$emit('input', []);
      }
      if (!this.multiple && Array.isArray(this.value)) {
        this.$emit('input', '');
      }
      // this.debounce方法用来返回节流的时间，防止短时间内多次触发
      this.debouncedOnInputChange = debounce(this.debounce, () => {
        this.onInputChange();
      });

      this.debouncedQueryChange = debounce(this.debounce, (e) => {
        this.handleQueryChange(e.target.value);
      });
      // 监听选项点击事件和选中选项的事件并绑定处理函数
      this.$on('handleOptionClick', this.handleOptionSelect);
      this.$on('setSelected', this.setSelected);
    },

    mounted() {
      if (this.multiple && Array.isArray(this.value) && this.value.length > 0) {
        this.currentPlaceholder = '';
      }
      addResizeListener(this.$el, this.handleResize);

      /* 设置输入框的大小 */
      const reference = this.$refs.reference;
      if (reference && reference.$el) {
        const sizeMap = {
          medium: 36,
          small: 32,
          mini: 28
        };
        const input = reference.$el.querySelector('input');
        this.initialInputHeight = input.getBoundingClientRect().height || sizeMap[this.selectSize];
      }
      if (this.remote && this.multiple) {
        this.resetInputHeight();
      }
      this.$nextTick(() => {
        if (reference && reference.$el) {
          this.inputWidth = reference.$el.getBoundingClientRect().width;
        }
      });
      this.setSelected();
    },

    beforeDestroy() {
      // 销毁之前移除事件监听
      if (this.$el && this.handleResize) removeResizeListener(this.$el, this.handleResize);
    }
  };
</script>
