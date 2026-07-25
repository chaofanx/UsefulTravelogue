const { getCapsuleInfo } = require('../../utils/capsule');

Component({
  options: {
    multipleSlots: true
  },

  properties: {
    // 页面标题，居中显示
    title: {
      type: String,
      value: ''
    },
    // 是否显示返回按钮
    leftArrow: {
      type: Boolean,
      value: false
    },
    // 导航栏背景色，默认跟随页面背景（--td-bg-color-page）
    background: {
      type: String,
      value: ''
    },
    // 标题 / 返回按钮颜色，默认跟随主题主文字色
    color: {
      type: String,
      value: ''
    },
    // 页面栈仅有一页时，返回操作跳转的首页路径
    homePath: {
      type: String,
      value: '/pages/index/index'
    },
    // 是否在文档流中渲染等高占位，避免页面内容被固定导航栏遮挡
    placeholder: {
      type: Boolean,
      value: true
    },
    // 是否显示底部细分隔线
    border: {
      type: Boolean,
      value: false
    },
    // 磨砂圆形按钮风格（覆盖在彩色封面 / 图片上时使用）
    frosted: {
      type: Boolean,
      value: false
    }
  },

  data: {
    statusBarHeight: 44,
    navHeight: 80,
    menuTop: 48,
    menuHeight: 32,
    menuRight: 8,
    capsuleLeft: 200
  },

  lifetimes: {
    attached() {
      const info = getCapsuleInfo();
      this.setData({
        statusBarHeight: info.statusBarHeight,
        navHeight: info.navHeightPx,
        menuTop: info.menuTopPx,
        menuHeight: info.menuHeightPx,
        menuRight: info.menuRightPx,
        capsuleLeft: info.capsuleLeft
      });
    }
  },

  methods: {
    onBack() {
      this.triggerEvent('back');
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack({ delta: 1 });
      } else {
        wx.reLaunch({ url: this.data.homePath });
      }
    }
  }
});
