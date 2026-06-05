const api = require('../../utils/api');
const { getAvatarText } = require('../../utils/util');

Page({
  data: {
    members: [],
    loading: true
  },

  onLoad(options) {
    const bookId = Number(options.bookId) || 1;
    api.getBook(bookId).then(book => {
      const members = ((book && book.members) ? book.members : []).map(m => ({
        ...m,
        firstChar: getAvatarText(m.name)
      }));
      this.setData({ members, loading: false });
    }).catch(err => {
      this.setData({ loading: false });
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    });
  },

  onBack() {
    wx.navigateBack();
  },

  onInvite() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage']
    });
    wx.showToast({ title: '点击右上角分享邀请', icon: 'none' });
  }
});
