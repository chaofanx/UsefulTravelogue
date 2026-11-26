const api = require('../../utils/api');
const cache = require('../../utils/cache');
const { formatDate } = require('../../utils/util');
const { parseBookId } = require('../../utils/bookPage');

Page({
  data: {
    bookId: 0,
    scheduleId: 0,
    ticket: null,
    book: null,
    loading: true
  },

  onLoad(options) {
    const bookId = parseBookId(options.bookId);
    if (!bookId) return;
    const scheduleId = Number(options.scheduleId) || 0;
    this.data.bookId = bookId;
    this.data.scheduleId = scheduleId;
    this.loadData();
  },

  loadData() {
    const bookId = this.data.bookId;
    cache.load(this, [
      { key: cache.keys.book(bookId), fetch: () => api.getBook(bookId) },
      { key: cache.keys.schedules(bookId), fetch: () => api.getSchedules(bookId) }
    ], (book, schedulesData) => this.applyData(book, schedulesData));
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
