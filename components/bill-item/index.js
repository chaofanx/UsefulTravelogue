const { formatAmount } = require('../../utils/util');

Component({
  properties: {
    bill: {
      type: Object,
      value: {}
    }
  },

  observers: {
    'bill'(bill) {
      if (bill) {
        this.setData({
          'bill.amountText': formatAmount(bill.amount)
        });
      }
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { bill: this.data.bill });
    }
  }
});
