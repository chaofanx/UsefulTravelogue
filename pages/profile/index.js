const api = require('../../utils/api');
const cache = require('../../utils/cache');

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
    const key = cache.keys.profile();
    const cached = cache.get(key);
    if (cached !== undefined) {
      // 先渲染缓存，后台请求回来后再更新
      this.setData({ userInfo: cached, loading: false });
    } else {
      this.setData({ loading: true });
    }
    cache.fetchAndCache(key, () => api.getUserProfile()).then(user => {
      this.setData({ userInfo: user, loading: false });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  onChooseAvatar() {
    const that = this;
    // Skyline 下 button open-type="chooseAvatar" 不可用，改用 wx.chooseMedia 选图
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        // tempFilePath 是本地临时路径，先用它预览，
        // 同时上传服务器换取持久 URL 后再存库
        const userInfo = { ...that.data.userInfo, avatar: tempFilePath };
        that.setData({ userInfo });

        wx.showLoading({ title: '上传中...', mask: true });
        api.uploadFile(tempFilePath)
          .then(url => api.updateUserProfile({ avatar: url }))
          .then(profile => {
            wx.hideLoading();
            that.setData({ userInfo: profile });
            const app = getApp();
            if (app.globalData) {
              app.globalData.userInfo = profile;
            }
          })
          .catch(() => {
            wx.hideLoading();
            wx.showToast({ title: '头像更新失败', icon: 'none' });
            that.loadProfile();
          });
      }
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
