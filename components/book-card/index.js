Component({
  properties: {
    book: {
      type: Object,
      value: {}
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('cardtap', { book: this.data.book });
    }
  }
});
