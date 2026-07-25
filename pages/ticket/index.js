const api = require('../../utils/api');
const cache = require('../../utils/cache');
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
    const bookId = this.data.bookId;
    const bookKey = cache.keys.book(bookId);
    const schedulesKey = cache.keys.schedules(bookId);
    const cachedBook = cache.get(bookKey);
    const cachedSchedules = cache.get(schedulesKey);
    if (cachedBook !== undefined && cachedSchedules !== undefined) {
      // 先渲染缓存，后台请求回来后再更新
      this.applyData(cachedBook, cachedSchedules);
    } else {
      this.setData({ loading: true });
    }
    Promise.all([
      cache.fetchAndCache(bookKey, () => api.getBook(bookId)),
      cache.fetchAndCache(schedulesKey, () => api.getSchedules(bookId))
    ]).then(([book, schedulesData]) => {
      this.applyData(book, schedulesData);
    }).catch(err => {
      this.setData({ loading: false });
      wx.showToast({
        title: (cachedBook !== undefined && cachedSchedules !== undefined)
          ? '数据更新失败，当前为缓存数据'
          : (err.message || '加载失败'),
        icon: 'none'
      });
    });
  },

  applyData(book, schedulesData) {
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
  }
});
