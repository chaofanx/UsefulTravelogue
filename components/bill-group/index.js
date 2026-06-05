const { formatDate, formatAmount } = require('../../utils/util');

Component({
  properties: {
    group: {
      type: Object,
      value: {}
    }
  },

  data: {
    displayDate: '',
    outAmount: '0',
    inAmount: '0'
  },

  observers: {
    'group'(group) {
      if (group) {
        this.setData({
          displayDate: formatDate(group.date),
          outAmount: formatAmount(group.totalOut || 0),
          inAmount: formatAmount(group.totalIn || 0)
        });
      }
    }
  },

  methods: {
    onBillTap(e) {
      this.triggerEvent('billtap', e.detail);
    }
  }
});
