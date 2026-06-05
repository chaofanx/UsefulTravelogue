const api = require('../../utils/api');

Page({
  data: { book: {}, loading: true },

  onLoad(options) {
    const id = Number(options.id) || 1;
    api.getBook(id).then(book => {
      this.setData({ book: book || {}, loading: false });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  onBack() {
    wx.navigateBack();
  },

  onGoBill() {
    const id = this.data.book.id;
    wx.redirectTo({ url: `/pages/book/bill/index?id=${id}` });
  },
  onGoSchedule() {
    const id = this.data.book.id;
    wx.redirectTo({ url: `/pages/book/schedule/index?id=${id}` });
  },
  onGoStatistics() {
    const id = this.data.book.id;
    wx.redirectTo({ url: `/pages/book/statistics/index?id=${id}` });
  }
});
