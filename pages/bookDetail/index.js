const api = require('../../utils/api');
const cache = require('../../utils/cache');

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
    // 被邀请的好友可能首次打开、登录尚未完成：先确保登录态就绪再加载账本
    if (api.hasToken()) {
      this.loadBook(id);
    } else {
      getApp().login().then(() => {
        this.loadBook(id);
      }).catch(() => {
        this.setData({ loading: false });
        wx.showToast({ title: '登录失败，请重新打开', icon: 'none' });
      });
    }
  },

  loadBook(id) {
    const bookId = id || this.data.book.id;
    const key = cache.keys.book(bookId);
    const cached = cache.get(key);
    if (cached !== undefined) {
      // 先渲染缓存，后台请求回来后再更新
      this.applyBook(cached);
    } else {
      this.setData({ loading: true });
    }
    cache.fetchAndCache(key, () => api.getBook(bookId)).then(book => {
      this.applyBook(book);
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  applyBook(book) {
    const currentUserId = getApp().globalData.userInfo?.id;
    const members = book?.members || [];
    const isMember = members.some(m => m.userId === currentUserId);
    this.setData({ book: book || {}, isMember, loading: false });
  },

  onJoinBook() {
    const bookId = this.data.book.id;
    if (!bookId) return;

    wx.showLoading({ title: '加入中...' });
    api.joinBook(bookId).then(() => {
      wx.hideLoading();
      cache.removeByPrefix(cache.keys.book(bookId));
      wx.showToast({ title: '加入成功', icon: 'success' });
      setTimeout(() => wx.redirectTo({ url: `/pages/bookDetail/index?id=${bookId}` }), 500);
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
