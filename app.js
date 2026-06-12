const api = require('./utils/api');

App({
  globalData: {
    userInfo: null,
    token: ''
  },

  onLaunch() {
    wx.setNavigationBarTitle({ title: '好用旅记' });
    this.login().catch(() => {});
  },

  onShow() {},

  // 登录（返回 Promise，页面可等待登录结果；并发调用复用同一次登录）
  login() {
    if (this._loginPromise) return this._loginPromise;

    this._loginPromise = new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (!res.code) {
            reject(new Error('获取登录凭证失败'));
            return;
          }
          api.login(res.code).then(data => {
            this.globalData.token = (data && data.token) || '';
            this.globalData.userInfo = (data && data.user) || null;
            resolve(data);
          }).catch(reject);
        },
        fail: (err) => reject(err)
      });
    });

    this._loginPromise.finally(() => {
      this._loginPromise = null;
    });

    return this._loginPromise;
  }
});
