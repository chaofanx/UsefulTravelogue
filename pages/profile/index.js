const api = require('../../utils/api');

Page({
  data: {
    userInfo: null,
    loading: true
  },

  onLoad() {
    this.loadProfile();
  },

  onShow() {
    if (this.data.userInfo) {
      this.loadProfile();
    }
  },

  loadProfile() {
    this.setData({ loading: true });
    api.getUserProfile().then(user => {
      this.setData({ userInfo: user, loading: false });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  onBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },

  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    if (!avatarUrl) return;

    const userInfo = { ...this.data.userInfo, avatar: avatarUrl };
    this.setData({ userInfo });

    api.updateUserProfile({ avatar: avatarUrl })
      .then(profile => {
        this.setData({ userInfo: profile });
        const app = getApp();
        if (app.globalData) {
          app.globalData.userInfo = profile;
        }
      })
      .catch(() => {
        wx.showToast({ title: '头像更新失败', icon: 'none' });
        this.loadProfile();
      });
  },

  onNicknameSave(e) {
    const nickname = (e.detail.value || '').trim();
    if (!nickname) return;
    if (nickname === (this.data.userInfo.nickname || '')) return;

    const userInfo = { ...this.data.userInfo, nickname };
    this.setData({ userInfo });

    api.updateUserProfile({ nickname })
      .then(profile => {
        this.setData({ userInfo: profile });
        const app = getApp();
        if (app.globalData) {
          app.globalData.userInfo = profile;
        }
      })
      .catch(() => {
        wx.showToast({ title: '昵称更新失败', icon: 'none' });
        this.loadProfile();
      });
  },

  onMenuItem(e) {
    const { type } = e.currentTarget.dataset;
    switch (type) {
      case 'feedback':
        wx.navigateTo({ url: '/pages/feedback/index' });
        break;
      case 'about':
        api.getSystemAbout().then(data => {
          wx.showModal({
            title: '关于好用旅记',
            content: (data && data.about) || '',
            showCancel: false
          });
        }).catch(() => {
          wx.showToast({ title: '获取关于信息失败', icon: 'none' });
        });
        break;
      default:
        wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  }
});
