const api = require('../../utils/api');
const cache = require('../../utils/cache');
const { getAvatarText } = require('../../utils/util');

Page({
  data: {
    members: [],
    bookId: 0,
    bookTitle: '',
    loading: true
  },

  onLoad(options) {
    const bookId = Number(options.bookId);
    if (!bookId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.setData({ bookId });
    const key = cache.keys.book(bookId);
    const cached = cache.get(key);
    if (cached !== undefined) {
      // 先渲染缓存，后台请求回来后再更新
      this.applyBook(cached);
    }
    cache.fetchAndCache(key, () => api.getBook(bookId)).then(book => {
      this.applyBook(book);
    }).catch(err => {
      this.setData({ loading: false });
      wx.showToast({
        title: cached !== undefined ? '数据更新失败，当前为缓存数据' : (err.message || '加载失败'),
        icon: 'none'
      });
    });
  },

  applyBook(book) {
    const aliases = (book && book.memberAliases) ? book.memberAliases : {};
    const members = ((book && book.members) ? book.members : []).map(m => ({
      ...m,
      displayName: aliases[m.name] || m.name,
      firstChar: getAvatarText(aliases[m.name] || m.name)
    }));
    this.setData({
      bookTitle: (book && book.title) || '',
      members,
      loading: false
    });
  },

  onBack() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return {
      title: `邀请你加入「${this.data.bookTitle}」账本`,
      path: `/pages/bookDetail/index?id=${this.data.bookId}&invite=1`
    };
  }
});
