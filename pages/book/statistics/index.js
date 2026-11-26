const api = require('../../../utils/api');
const cache = require('../../../utils/cache');
const { formatAmount } = require('../../../utils/util');
const { parseBookId, switchBookTab, inviteShare } = require('../../../utils/bookPage');

Page({
  data: {
    bookId: 0,
    book: {},
    totalAmount: '0',
    chartData: [],
    categoryStatsData: [],
    maxValue: 0,
    settlements: [],
    settlementMode: 'smart',
    currentUserStats: null,
    isVip: false,
    loading: true
  },

  onBookChange(e) {
    this.setData({ book: e.detail.book });
  },

  onLoad(options) {
    const bookId = parseBookId(options.id);
    if (!bookId) return;
    this.data.bookId = bookId;

    // 会员状态决定是否显示导出按钮
    const profileKey = cache.keys.profile();
    const cachedProfile = cache.get(profileKey);
    if (cachedProfile !== undefined) {
      this.setData({ isVip: !!(cachedProfile && cachedProfile.vip) });
    }
    cache.fetchAndCache(profileKey, () => api.getUserProfile()).then(profile => {
      this.setData({ isVip: !!(profile && profile.vip) });
    }).catch(() => {});

    cache.load(this, [
      { key: cache.keys.book(bookId), fetch: () => api.getBook(bookId) },
      { key: cache.keys.statistics(bookId), fetch: () => api.getStatistics(bookId) },
      { key: cache.keys.settlements(bookId, 'smart'), fetch: () => api.getSettlements(bookId, 'smart') }
    ], (book, statsData, settlementData) => this.applyData(book, statsData, settlementData));
  },

  applyData(book, statsData, settlementData) {
    const categoryStats = (statsData && statsData.categories) ? statsData.categories : [];
    const total = statsData ? (statsData.totalAmount || 0) : 0;

    const statsDataFormatted = categoryStats.map(item => ({
      ...item,
      valueText: formatAmount(item.value)
    }));

    const maxValue = statsDataFormatted.length > 0
      ? Math.max(...statsDataFormatted.map(item => item.value))
      : 0;

    const cus = (statsData && statsData.currentUserStats) || null;
    const currentUserStats = cus ? {
      ...cus,
      paidText: formatAmount(cus.paid),
      shouldPayText: formatAmount(cus.shouldPay),
      net: cus.net,
      netText: formatAmount(Math.abs(cus.net)),
      netLabel: cus.net >= 0 ? '应收' : '应付',
    } : null;

    this.setData({
      book: book || {},
      totalAmount: formatAmount(total),
      chartData: statsDataFormatted,
      categoryStatsData: statsDataFormatted,
      maxValue,
      settlements: this.formatSettlements(settlementData),
      currentUserStats,
      loading: false
    });
  },

  formatSettlements(settlementData) {
    const settlementList = (settlementData && settlementData.settlements)
      ? settlementData.settlements
      : [];
    return settlementList.map(s => {
      const fu = s.fromUser || {};
      return {
        name: fu.nickname ? fu.nickname.charAt(0) : '',
        fullName: fu.nickname || '',
        avatar: fu.avatar || '',
        avatarColor: fu.avatarColor || '',
        desc: s.description || '',
        amount: s.amount || 0,
        amountText: formatAmount(s.amount || 0)
      };
    });
  },

  onSettlementMode(e) {
    const { mode } = e.currentTarget.dataset;
    this.setData({ settlementMode: mode });
    const settlementsKey = cache.keys.settlements(this.data.bookId, mode);
    const cached = cache.get(settlementsKey);
    if (cached !== undefined) {
      this.setData({ settlements: this.formatSettlements(cached) });
    }
    cache.fetchAndCache(settlementsKey, () => api.getSettlements(this.data.bookId, mode)).then(settlementData => {
      this.setData({ settlements: this.formatSettlements(settlementData) });
    }).catch(err => {
      wx.showToast({
        title: cached !== undefined ? '数据更新失败，当前为缓存数据' : (err.message || '加载失败'),
        icon: 'none'
      });
    });
  },

  onViewTeamPlan() {
    api.getTeamSettlements(this.data.bookId).then(data => {
      console.log('Team plan:', data);
    }).catch(() => {});
  },

  onShareSettlement() {
  },

  onMoreStats() {
    wx.showToast({ title: '更多统计开发中', icon: 'none' });
  },

  onExportExcel() {
    const { bookId } = this.data;
    const token = api.getToken();
    wx.showLoading({ title: '导出中...' });
    wx.downloadFile({
      url: `${api.BASE_URL}/books/${bookId}/export`,
      header: { 'Authorization': token ? `Bearer ${token}` : '' },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          wx.openDocument({
            filePath: res.tempFilePath,
            fileType: 'xlsx',
            showMenu: true,
            fail: () => {
              wx.showToast({ title: '打开文件失败', icon: 'none' });
            }
          });
        } else if (res.statusCode === 403) {
          wx.showToast({ title: '导出 Excel 是高级会员专属功能', icon: 'none' });
        } else {
          wx.showToast({ title: '导出失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '导出失败，请检查网络', icon: 'none' });
      }
    });
  },

  onTabChange(e) {
    switchBookTab(this.data.bookId, e.detail.key);
  },

  onShareAppMessage() {
    return inviteShare(this.data.book, this.data.bookId);
  }
});
