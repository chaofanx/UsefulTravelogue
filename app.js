const api = require('./utils/api');

App({
  globalData: {
    userInfo: null,
    token: ''
  },

  onLaunch() {
    wx.setNavigationBarTitle({ title: '好用旅记' });
    this.login();
  },

  onShow() {},

  login() {
    wx.login({
      success: (res) => {
        if (res.code) {
          api.login(res.code).then(data => {
            this.globalData.token = data.token || '';
            this.globalData.userInfo = data.user || null;
          }).catch(() => {});
        }
      }
    });
  }
});
