Component({
  properties: {
    item: {
      type: Object,
      value: {}
    },
    isLast: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    onEditTap() {
      this.triggerEvent('edittap', { item: this.data.item });
    },

    onOpenMap() {
      const item = this.data.item;
      if (item.latitude && item.longitude) {
        wx.openLocation({
          latitude: item.latitude,
          longitude: item.longitude,
          name: item.location,
          address: item.address,
          scale: 16
        });
      }
    }
  }
});
