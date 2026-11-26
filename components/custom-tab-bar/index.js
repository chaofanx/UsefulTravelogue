Component({
  properties: {
    current: {
      type: String,
      value: 'bill'
    },
    bookId: {
      type: Number,
      value: 1
    }
  },

  data: {
    tabs: [
      { key: 'bill', label: '账单', icon: 'bill' },
      { key: 'schedule', label: '行程', icon: 'schedule' },
      { key: 'statistics', label: '分账', icon: 'statistics' }
    ]
  },

  methods: {
    onTabTap(e) {
      const { key } = e.currentTarget.dataset;
      if (key !== this.data.current) {
        this.triggerEvent('change', { key });
      }
    }
  }
});
