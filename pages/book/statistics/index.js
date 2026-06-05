const api = require('../../../utils/api');
const { formatAmount } = require('../../../utils/util');

Page({
  data: {
    bookId: 1,
    book: {},
    totalAmount: '0',
    chartData: [],
    categoryStatsData: [],
    maxValue: 0,
    settlements: [],
    settlementMode: 'smart',
    loading: true
  },

  onBookChange(e) {
    this.setData({ book: e.detail.book });
  },

  onLoad(options) {
    const bookId = Number(options.id) || 1;
    Promise.all([
      api.getBook(bookId),
      api.getStatistics(bookId),
      api.getSettlements(bookId, 'smart')
    ]).then(([book, statsData, settlementData]) => {
      const categoryStats = (statsData && statsData.categories) ? statsData.categories : [];
      const total = statsData ? statsData.totalAmount : 0;

      const statsDataFormatted = categoryStats.map(item => ({
        ...item,
        valueText: formatAmount(item.value)
      }));

      const maxValue = statsDataFormatted.length > 0
        ? Math.max(...statsDataFormatted.map(item => item.value))
        : 0;

      const settlementList = (settlementData && settlementData.settlements)
        ? settlementData.settlements
        : [];
      const settlements = settlementList.map(s => ({
        name: (s.fromUser && s.fromUser.nickname) ? s.fromUser.nickname.charAt(0) : '',
        fullName: (s.fromUser && s.fromUser.nickname) || '',
        avatar: (s.fromUser && s.fromUser.avatar) || '',
        avatarColor: (s.fromUser && s.fromUser.avatarColor) || '',
        desc: s.description || '',
        amount: s.amount || 0,
        amountText: formatAmount(s.amount || 0)
      }));

      this.setData({
        bookId,
        book: book || {},
        totalAmount: formatAmount(total),
        chartData: statsDataFormatted,
        categoryStatsData: statsDataFormatted,
        maxValue,
        settlements,
        loading: false
      });
    }).catch(err => {
      this.setData({ loading: false });
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    });
  },

  onSettlementMode(e) {
    const { mode } = e.currentTarget.dataset;
    this.setData({ settlementMode: mode });
    api.getSettlements(this.data.bookId, mode).then(settlementData => {
      const settlementList = (settlementData && settlementData.settlements)
        ? settlementData.settlements
        : [];
      const settlements = settlementList.map(s => ({
        name: (s.fromUser && s.fromUser.nickname) ? s.fromUser.nickname.charAt(0) : '',
        fullName: (s.fromUser && s.fromUser.nickname) || '',
        avatar: (s.fromUser && s.fromUser.avatar) || '',
        avatarColor: (s.fromUser && s.fromUser.avatarColor) || '',
        desc: s.description || '',
        amount: s.amount || 0,
        amountText: formatAmount(s.amount || 0)
      }));
      this.setData({ settlements });
    }).catch(err => {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    });
  },

  onViewTeamPlan() {
    api.getTeamSettlements(this.data.bookId).then(data => {
      console.log('Team plan:', data);
    }).catch(() => {});
  },

  onCreatePersonal() {
    wx.navigateTo({ url: '/pages/createBook/index' });
  },

  onShareSettlement() {
  },

  onMoreStats() {
    wx.showToast({ title: '更多统计开发中', icon: 'none' });
  },

  onExportExcel() {
    wx.showToast({ title: '导出功能开发中', icon: 'none' });
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
      title: `${this.data.book.title} - 分账统计`,
      path: `/pages/book/statistics/index?id=${this.data.bookId}`
    };
  }
});
