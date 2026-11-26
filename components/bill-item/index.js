const { formatAmount } = require('../../utils/util');

Component({
  properties: {
    bill: {
      type: Object,
      value: {}
    }
  },

  data: {
    amountText: '',
    originalText: ''
  },

  observers: {
    'bill'(bill) {
      if (bill) {
        const foreign = bill.currency && bill.currency !== 'CNY' && bill.originalAmount != null;
        this.setData({
          amountText: formatAmount(bill.amount),
          originalText: foreign ? `${formatAmount(bill.originalAmount)} ${bill.currency}` : ''
        });
      }
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('itemtap', { bill: this.data.bill });
    }
  }
});
