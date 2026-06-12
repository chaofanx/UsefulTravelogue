const api = require('../../utils/api');
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
    api.getBook(bookId).then(book => {
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
    }).catch(err => {
      this.setData({ loading: false });
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
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
