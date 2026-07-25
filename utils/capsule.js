// 设备状态栏 / 胶囊按钮信息 — 所有页面统一从这里取，
// 保证顶部内容都排在状态栏下方，不被遮挡。
function getCapsuleInfo() {
  try {
    const windowInfo = wx.getWindowInfo();
    const menuButton = wx.getMenuButtonBoundingClientRect();
    const sysInfo = wx.getSystemInfoSync();
    const pxToRpx = 750 / sysInfo.windowWidth;

    return {
      navBarHeight: windowInfo.statusBarHeight + 44,
      statusBarHeight: windowInfo.statusBarHeight,
      menuTop: Math.ceil(menuButton.top * pxToRpx),
      menuRight: Math.ceil((sysInfo.windowWidth - menuButton.right) * pxToRpx),
      menuHeight: Math.ceil(menuButton.height * pxToRpx),
      // 胶囊左侧到屏幕右边距离 + 16rpx 间距，用于 content 右边距和 actions 定位
      capsuleLeft: Math.ceil((sysInfo.windowWidth - menuButton.left) * pxToRpx) + 16,
      // px 单位：固定导航栏（nav-bar 组件）定位用
      // 导航栏总高度 = 状态栏高度 + 胶囊与状态栏间距 + 胶囊高度
      navHeightPx: windowInfo.statusBarHeight + (menuButton.top - windowInfo.statusBarHeight) + menuButton.height,
      menuTopPx: menuButton.top,
      menuHeightPx: menuButton.height,
      menuRightPx: sysInfo.windowWidth - menuButton.right,
    };
  } catch (e) {
    return {
      navBarHeight: 88,
      statusBarHeight: 44,
      menuTop: 40,
      menuRight: 16,
      menuHeight: 64,
      capsuleLeft: 200,
      navHeightPx: 80,
      menuTopPx: 48,
      menuHeightPx: 32,
      menuRightPx: 8,
    };
  }
}

module.exports = {
  getCapsuleInfo
};
