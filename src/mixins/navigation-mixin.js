export default {
  data() {
    return {
      hoverOption: -1
    };
  },

  computed: {
    optionsAllDisabled() {  // 为true时表示所有可见的可选项都是disabled的
      return this.options.filter(option => option.visible).every(option => option.disabled);
    }
  },

  watch: {
    hoverIndex(val) {
      if (typeof val === 'number' && val > -1) {
        this.hoverOption = this.options[val] || {};
      }
      this.options.forEach(option => {
        option.hover = this.hoverOption === option;
      });
    }
  },

  methods: {
    navigateOptions(direction) {
      // 当下拉框没有打开时，不管direction是什么值，都直接打开下拉框
      if (!this.visible) {
        this.visible = true;
        return;
      }
      // 当没有可选项时，不做任何操作
      if (this.options.length === 0 || this.filteredOptionsCount === 0) return;
      if (!this.optionsAllDisabled) {  // 有非禁止的可选项时
        if (direction === 'next') {
          this.hoverIndex++;
          if (this.hoverIndex === this.options.length) {
            this.hoverIndex = 0;
          }
        } else if (direction === 'prev') {
          this.hoverIndex--;
          if (this.hoverIndex < 0) {
            this.hoverIndex = this.options.length - 1;
          }
        }
        const option = this.options[this.hoverIndex];
        if (option.disabled === true ||
          option.groupDisabled === true ||
          !option.visible) { // 直接跳过不可选可不可见的选项
          this.navigateOptions(direction);
        }
        // 将窗口滚动到当前选中的option位置
        this.$nextTick(() => this.scrollToOption(this.hoverOption));
      }
    }
  }
};
