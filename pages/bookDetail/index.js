const api = require('../../utils/api');
const cache = require('../../utils/cache');
const { parseBookId } = require('../../utils/bookPage');

Page({
  data: { book: {}, loading: true, isInvited: false, isMember: true },

  onLoad(options) {
    const id = parseBookId(options.id);
    if (!id) return;
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
    this.joinBook();
  },

  // nickname 为空时用个人资料昵称；账本内重名（409）时让用户改名后重试
  joinBook(nickname) {
    const bookId = this.data.book.id;
    if (!bookId) return;

    wx.showLoading({ title: '加入中...' });
    api.joinBook(bookId, nickname).then(() => {
      wx.hideLoading();
      cache.removeByPrefix(cache.keys.book(bookId));
      wx.showToast({ title: '加入成功', icon: 'success' });
      setTimeout(() => wx.redirectTo({ url: `/pages/bookDetail/index?id=${bookId}` }), 500);
    }).catch(err => {
      wx.hideLoading();
      if (err && err.code === 409) {
        this.promptRename(err);
        return;
      }
      wx.showToast({ title: (err && err.message) || '加入失败', icon: 'none' });
    });
  },

  // 输入框留空时使用建议昵称；只改本账本内的昵称，不影响个人资料
  promptRename(err) {
    const suggested = (err.data && err.data.suggestedNickname) || '';
    wx.showModal({
      title: '昵称已被占用',
      content: '',
      editable: true,
      placeholderText: suggested ? `${suggested}（留空使用此名）` : '请输入新昵称',
      confirmText: '用此昵称加入',
      success: (res) => {
        if (!res.confirm) return;
        const name = (res.content || '').trim() || suggested;
        if (!name) {
          wx.showToast({ title: '请输入昵称', icon: 'none' });
          return;
        }
        this.joinBook(name);
      }
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
