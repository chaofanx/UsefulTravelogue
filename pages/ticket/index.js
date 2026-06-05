Page({
  onBack() {
    wx.navigateBack();
  },
  onShareAppMessage() {
    return {
      title: '我的行程票根 - 好用旅记',
      path: '/pages/ticket/index'
    };
  }
});
