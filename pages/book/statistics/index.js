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
    settlementRecords: [],
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
      { key: cache.keys.settlements(bookId, 'smart'), fetch: () => api.getSettlements(bookId, 'smart') },
      { key: cache.keys.settlementRecords(bookId), fetch: () => api.getSettlementRecords(bookId) }
    ], (book, statsData, settlementData, recordsData) => this.applyData(book, statsData, settlementData, recordsData));
  },

  applyData(book, statsData, settlementData, recordsData) {
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
      settlementRecords: this.formatRecords(recordsData),
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
      const tu = s.toUser || {};
      return {
        key: `${fu.memberId}-${tu.memberId}`,
        fromMemberId: fu.memberId,
        toMemberId: tu.memberId,
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

  formatRecords(recordsData) {
    const list = (recordsData && recordsData.records) ? recordsData.records : [];
    return list.map(r => ({
      id: r.id,
      fromName: r.fromNickname,
      toName: r.toNickname,
      amountText: formatAmount(r.amount)
    }));
  },

  // 写操作后重新拉取当前模式的方案和记录列表（缓存已在 api.js 中失效）
  reloadSettlements() {
    const { bookId, settlementMode } = this.data;
    return Promise.all([
      cache.fetchAndCache(cache.keys.settlements(bookId, settlementMode), () => api.getSettlements(bookId, settlementMode)),
      cache.fetchAndCache(cache.keys.settlementRecords(bookId), () => api.getSettlementRecords(bookId))
    ]).then(([settlementData, recordsData]) => {
      this.setData({
        settlements: this.formatSettlements(settlementData),
        settlementRecords: this.formatRecords(recordsData)
      });
    });
  },

  onMarkPaid(e) {
    const item = this.data.settlements[e.currentTarget.dataset.index];
    if (!item || !item.fromMemberId || !item.toMemberId) return;
    wx.showModal({
      title: '标记已还款',
      content: `确认「${item.fullName}」已向对方转账 ¥${item.amountText}？`,
      success: (res) => {
        if (!res.confirm) return;
        api.createSettlementRecord(this.data.bookId, {
          fromMemberId: item.fromMemberId,
          toMemberId: item.toMemberId,
          amount: item.amount
        }).then(() => this.reloadSettlements())
          .then(() => wx.showToast({ title: '已标记', icon: 'success' }))
          .catch(err => wx.showToast({ title: (err && err.message) || '操作失败', icon: 'none' }));
      }
    });
  },

  onUndoRecord(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '撤销还款记录',
      content: '撤销后这笔转账会重新出现在待还款列表中。',
      success: (res) => {
        if (!res.confirm) return;
        api.deleteSettlementRecord(this.data.bookId, id)
          .then(() => this.reloadSettlements())
          .catch(err => wx.showToast({ title: (err && err.message) || '操作失败', icon: 'none' }));
      }
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
