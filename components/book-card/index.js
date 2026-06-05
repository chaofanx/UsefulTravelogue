Component({
  properties: {
    book: {
      type: Object,
      value: {}
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { book: this.data.book });
    }
  }
});
