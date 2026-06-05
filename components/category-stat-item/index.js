const { formatAmount } = require('../../utils/util');

Component({
  properties: {
    item: {
      type: Object,
      value: {}
    },
    maxValue: {
      type: Number,
      value: 0
    }
  },

  observers: {
    'item, maxValue'(item, maxValue) {
      if (item && maxValue > 0) {
        const percent = (item.value / maxValue) * 100;
        this.setData({
          'item.valueText': formatAmount(item.value),
          'item.percent': Math.min(percent, 100)
        });
      }
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { item: this.data.item });
    }
  }
});
