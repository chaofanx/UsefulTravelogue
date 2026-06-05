const api = require('../../../utils/api');

Page({
  data: {
    bookId: 1,
    book: {},
    groupedBills: [],
    loading: true
  },

  onLoad(options) {
    const bookId = Number(options.id) || 1;
    this.data.bookId = bookId;
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    this.setData({ loading: true });
    Promise.all([
      api.getBook(this.data.bookId),
      api.getBills(this.data.bookId)
    ]).then(([book, billsData]) => {
      const groupedBills = (billsData && billsData.groups) ? billsData.groups : [];
      this.setData({ book: book || {}, groupedBills, loading: false });
    }).catch(err => {
      this.setData({ loading: false });
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    });
  },

  onBookChange(e) {
    this.setData({ book: e.detail.book });
  },

  onBillTap(e) {
    const bill = e.detail.bill;
    wx.navigateTo({
      url: `/pages/addBill/index?bookId=${this.data.bookId}&billId=${bill.id}`
    });
  },

  onAddBill() {
    wx.navigateTo({ url: `/pages/addBill/index?bookId=${this.data.bookId}` });
  },

  onTabChange(e) {
    const { key } = e.detail;
    const routes = {
      bill: '/pages/book/bill/index',
      schedule: '/pages/book/schedule/index',
      statistics: '/pages/book/statistics/index'
    };
    wx.redirectTo({ url: `${routes[key]}?id=${this.data.bookId}` });
  },

  onShareAppMessage() {
    return {
      title: `${this.data.book.title} - 旅行账单`,
      path: `/pages/book/bill/index?id=${this.data.bookId}`
    };
  }
});
