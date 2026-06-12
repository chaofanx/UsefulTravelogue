const api = require('../../utils/api');

Page({
  data: { book: {}, loading: true, isInvited: false, isMember: true },

  onLoad(options) {
    const id = Number(options.id);
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.setData({ isInvited: !!options.invite });
    this.loadBook(id);
  },

  loadBook(id) {
    const bookId = id || this.data.book.id;
    this.setData({ loading: true });
    api.getBook(bookId).then(book => {
      const currentUserId = getApp().globalData.userInfo?.id;
      const members = book?.members || [];
      const isMember = members.some(m => m.userId === currentUserId);
      this.setData({ book: book || {}, isMember, loading: false });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  onBack() {
    wx.navigateBack();
  },

  onJoinBook() {
    const bookId = this.data.book.id;
    if (!bookId) return;

    wx.showLoading({ title: '加入中...' });
    api.joinBook(bookId).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '加入成功', icon: 'success' });
      this.loadBook(bookId);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: err.message || '加入失败', icon: 'none' });
    });
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
