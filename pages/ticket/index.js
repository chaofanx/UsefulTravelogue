const api = require('../../utils/api');
const { formatDate } = require('../../utils/util');

Page({
  data: {
    bookId: 0,
    scheduleId: 0,
    ticket: null,
    book: null,
    loading: true
  },

  onLoad(options) {
    const bookId = Number(options.bookId);
    const scheduleId = Number(options.scheduleId) || 0;
    if (!bookId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.data.bookId = bookId;
    this.data.scheduleId = scheduleId;
    this.loadData();
  },

  loadData() {
    this.setData({ loading: true });
    Promise.all([
      api.getBook(this.data.bookId),
      api.getSchedules(this.data.bookId)
    ]).then(([book, schedulesData]) => {
      const allSchedules = [];
      if (schedulesData && schedulesData.groups) {
        schedulesData.groups.forEach(g => {
          if (g.schedules && Array.isArray(g.schedules)) {
            g.schedules.forEach(s => {
              allSchedules.push({ ...s, groupDate: g.date });
            });
          }
        });
      }

      const targetSchedule = this.data.scheduleId
        ? allSchedules.find(s => s.id === this.data.scheduleId)
        : (allSchedules.length > 0 ? allSchedules[allSchedules.length - 1] : null);

      if (!targetSchedule && allSchedules.length > 0) {
        this.setData({
          book: book || {},
          ticket: allSchedules[0],
          formattedDate: allSchedules[0].date ? formatDate(allSchedules[0].date) : '',
          memberCount: (book && book.members) ? book.members.length : 0,
          loading: false
        });
      } else if (targetSchedule) {
        this.setData({
          book: book || {},
          ticket: targetSchedule,
          formattedDate: targetSchedule.date ? formatDate(targetSchedule.date) : '',
          memberCount: (book && book.members) ? book.members.length : 0,
          loading: false
        });
      } else {
        this.setData({
          book: book || {},
          memberCount: (book && book.members) ? book.members.length : 0,
          loading: false
        });
      }
    }).catch(err => {
      this.setData({ loading: false });
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    });
  },

  onBack() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return {
      title: '我的行程票根 - 好用旅记',
      path: `/pages/ticket/index?bookId=${this.data.bookId}&scheduleId=${this.data.scheduleId}`
    };
  }
});
