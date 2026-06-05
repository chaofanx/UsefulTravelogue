const api = require('../../utils/api');

const DEFAULT_COLORS = ['#4A90D9', '#FF6B6B', '#38C172', '#FFD93D', '#6C5CE7', '#FF8C42', '#45B7D1', '#96CEB4'];

Page({
  data: {
    books: [],
    loading: true,
    showCreatePopup: false,
    newBookName: '',
    newBookCover: '',
    newBookColor: '#4A90D9',
    coverColors: DEFAULT_COLORS
  },

  onLoad() {
    this.loadBooks();
  },

  onShow() {
    this.loadBooks();
  },

  loadBooks() {
    this.setData({ loading: true });
    api.getBooks().then(books => {
      this.setData({ books: Array.isArray(books) ? books : [], loading: false });
    }).catch(err => {
      this.setData({ loading: false });
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
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

    const bookData = {
      title: newBookName.trim(),
      cover: newBookCover,
      coverColor: newBookColor,
      date: this.getCurrentMonth()
    };

    api.createBook(bookData).then(book => {
      this.setData({
        showCreatePopup: false,
        newBookName: '',
        newBookCover: '',
        newBookColor: DEFAULT_COLORS[0]
      });
      wx.showToast({ title: '创建成功！', icon: 'success' });
      this.loadBooks();
    }).catch(err => {
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

  onShare() {
  },

  onFeedback() {
    wx.navigateTo({ url: '/pages/feedback/index' });
  },

  onShareAppMessage() {
    return {
      title: '好用旅记 - 简单好用的多人记账工具',
      path: '/pages/index/index'
    };
  }
});
