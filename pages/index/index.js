const api = require('../../utils/api');
const cache = require('../../utils/cache');
const { getCapsuleInfo } = require('../../utils/capsule');

const DEFAULT_COLORS = ['#4A90D9', '#FF6B6B', '#38C172', '#FFD93D', '#6C5CE7', '#FF8C42', '#45B7D1', '#96CEB4'];

Page({
  data: {
    books: [],
    loading: true,
    statusBarHeight: 44,
    showCreatePopup: false,
    newBookName: '',
    newBookCover: '',
    newBookColor: '#4A90D9',
    coverColors: DEFAULT_COLORS
  },

  onLoad() {
    this.setData({ statusBarHeight: getCapsuleInfo().statusBarHeight });
  },

  onShow() {
    // 首页禁止分享，隐藏胶囊菜单中的分享项
    wx.hideShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] });
    this.init();
  },

  // 进入首页先确认登录态：未登录时提示并发起登录，成功后再加载数据
  init() {
    if (api.hasToken()) {
      this.loadBooks();
      return;
    }
    wx.showToast({ title: '未登录，正在登录...', icon: 'none' });
    getApp().login().then(() => {
      wx.showToast({ title: '登录成功', icon: 'success' });
      this.loadBooks();
    }).catch(() => {
      this.setData({ loading: false });
      wx.showModal({
        title: '未登录',
        content: '登录失败，请检查网络后重试',
        confirmText: '重新登录',
        showCancel: false,
        success: (res) => {
          if (res.confirm) this.init();
        }
      });
    });
  },

  loadBooks() {
    const key = cache.keys.books();
    const cached = cache.get(key);
    if (cached !== undefined) {
      // 先渲染缓存，后台请求回来后再更新
      this.setData({ books: cached, loading: false });
    } else {
      this.setData({ loading: true });
    }
    cache.fetchAndCache(key, () => api.getBooks()).then(books => {
      this.setData({ books: Array.isArray(books) ? books : [], loading: false });
    }).catch(err => {
      this.setData({ loading: false });
      if (err && err.code === 401 && !this._retriedLogin) {
        // token 失效（api 层已清除），重新走一次登录流程
        this._retriedLogin = true;
        this.init();
        return;
      }
      wx.showToast({
        title: cached !== undefined ? '数据更新失败，当前为缓存数据' : (err.message || '加载失败'),
        icon: 'none'
      });
    });
  },

  onCreateBook() {
    this.setData({
      showCreatePopup: true,
      newBookName: '',
      newBookCover: '',
      newBookColor: DEFAULT_COLORS[0]
    });
  },

  onPopupVisibleChange(e) {
    this.setData({ showCreatePopup: e.detail.visible });
  },

  onNewBookNameInput(e) {
    this.setData({ newBookName: e.detail.value });
  },

  onColorPick(e) {
    this.setData({
      newBookColor: e.currentTarget.dataset.color,
      newBookCover: ''
    });
  },

  onChooseCover() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        that.setData({ newBookCover: tempFilePath });
      }
    });
  },

  onConfirmCreateBook() {
    const { newBookName, newBookCover, newBookColor } = this.data;
    if (!newBookName.trim()) {
      wx.showToast({ title: '请输入账本名称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '创建中...', mask: true });

    // 封面是本地临时路径时，先上传服务器换取持久 URL
    const coverPromise = api.isTempFilePath(newBookCover)
      ? api.uploadFile(newBookCover)
      : Promise.resolve(newBookCover);

    coverPromise.then(cover => {
      return api.createBook({
        title: newBookName.trim(),
        cover: cover,
        coverColor: newBookColor,
        date: this.getCurrentMonth()
      });
    }).then(book => {
      wx.hideLoading();
      this.setData({
        showCreatePopup: false,
        newBookName: '',
        newBookCover: '',
        newBookColor: DEFAULT_COLORS[0]
      });
      wx.showToast({ title: '创建成功！', icon: 'success' });
      this.loadBooks();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    });
  },

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}年${now.getMonth() + 1}月`;
  },

  onProfile() {
    wx.navigateTo({ url: '/pages/profile/index' });
  },

  onBookTap(e) {
    const { book } = e.detail;
    wx.navigateTo({ url: `/pages/book/bill/index?id=${book.id}` });
  },

  onFeedback() {
    wx.navigateTo({ url: '/pages/feedback/index' });
  }
});
