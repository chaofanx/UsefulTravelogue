const { formatAmount } = require('../../utils/util');

Component({
  properties: {
    bill: {
      type: Object,
      value: {}
    }
  },

  data: {
    amountText: ''
  },

  observers: {
    'bill'(bill) {
      if (bill) {
        this.setData({
          amountText: formatAmount(bill.amount)
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
