const api = require('../../utils/api');

Page({
  data: {
    userInfo: null,
    loading: true
  },

  onLoad() {
    api.getUserProfile().then(user => {
      this.setData({ userInfo: user, loading: false });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  onBack() {
    wx.navigateBack();
  },

  onMenuItem(e) {
    const { type } = e.currentTarget.dataset;
    switch (type) {
      case 'feedback':
        wx.navigateTo({ url: '/pages/feedback/index' });
        break;
      case 'about':
        wx.showModal({
          title: '关于好用旅记',
          content: '好用旅记是一款的简单好用的多人旅行记账工具。\n版本：1.0.0',
          showCancel: false
        });
        break;
      default:
        wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  }
});
