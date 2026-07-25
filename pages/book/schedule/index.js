const api = require('../../../utils/api');
const cache = require('../../../utils/cache');
const { formatDateShort } = require('../../../utils/util');

function dateToStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

Page({
  data: {
    bookId: 0,
    book: {},
    groupedSchedules: [],
    loading: true,
    showFormPopup: false,
    editingId: null,
    formLocation: '',
    formAddress: '',
    formLat: null,
    formLng: null,
    formPeriod: '全天',
    formNotes: '',
    formDate: '',
    todayStr: '',
    tomorrowStr: '',
    periods: ['全天', '上午', '下午', '晚上']
  },

  onLoad(options) {
    const bookId = Number(options.id);
    if (!bookId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.data.bookId = bookId;
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
    const scheduleGroups = (schedulesData && schedulesData.groups)
      ? schedulesData.groups
      : [];
    const groupedSchedules = scheduleGroups.map(group => ({
      ...group,
      monthDay: formatDateShort(group.date)
    }));
    this.setData({ book: book || {}, groupedSchedules, loading: false });
  },

  onBookChange(e) {
    this.setData({ book: e.detail.book });
  },

  resetForm() {
    const now = new Date();
    const todayStr = dateToStr(now);
    const tomorrowStr = dateToStr(new Date(now.getTime() + 86400000));
    this.setData({
      editingId: null,
      formLocation: '',
      formAddress: '',
      formLat: null,
      formLng: null,
      formPeriod: '全天',
      formNotes: '',
      formDate: todayStr,
      todayStr,
      tomorrowStr
    });
  },

  onScheduleEdit(e) {
    const item = e.detail.item;
    const now = new Date();
    const todayStr = dateToStr(now);
    const tomorrowStr = dateToStr(new Date(now.getTime() + 86400000));
    this.setData({
      showFormPopup: true,
      editingId: item.id,
      formLocation: item.location || '',
      formAddress: item.address || '',
      formLat: item.latitude || null,
      formLng: item.longitude || null,
      formPeriod: item.period || '全天',
      formNotes: item.notes || '',
      formDate: item.date || todayStr,
      todayStr,
      tomorrowStr
    });
  },

  onTicketTap() {
    wx.navigateTo({ url: `/pages/ticket/index?bookId=${this.data.bookId}` });
  },

  onAddSchedule() {
    this.resetForm();
    this.setData({ showFormPopup: true });
  },

  onFormPopupVisible(e) {
    if (!e.detail.visible) {
      this.setData({ showFormPopup: false });
    }
  },

  onChooseLocation() {
    const that = this;
    wx.chooseLocation({
      success(res) {
        if (res.name) {
          that.setData({
            formLocation: res.name,
            formAddress: res.address || '',
            formLat: res.latitude,
            formLng: res.longitude
          });
        }
      },
      fail(err) {
        if (err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '选择地点失败', icon: 'none' });
        }
      }
    });
  },

  onPeriodTap(e) {
    this.setData({ formPeriod: e.currentTarget.dataset.period });
  },

  onDateQuick(e) {
    this.setData({ formDate: e.currentTarget.dataset.date });
  },

  onDatePick(e) {
    this.setData({ formDate: e.detail.value });
  },

  onNotesInput(e) {
    this.setData({ formNotes: e.detail.value });
  },

  onCancelForm() {
    this.setData({ showFormPopup: false });
  },

  onDeleteSchedule() {
    const { editingId, bookId } = this.data;
    if (!editingId) return;

    wx.showModal({
      title: '删除行程',
      content: '确定要删除这条行程吗？',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          api.deleteSchedule(bookId, editingId).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.setData({ showFormPopup: false });
            this.loadData();
          }).catch(err => {
            wx.showToast({ title: err.message || '删除失败', icon: 'none' });
          });
        }
      }
    });
  },

  onConfirmSchedule() {
    const { formLocation, formNotes, editingId, bookId } = this.data;
    if (!formLocation.trim()) {
      wx.showToast({ title: '请选择目的地', icon: 'none' });
      return;
    }

    const scheduleData = {
      location: this.data.formLocation,
      address: this.data.formAddress,
      latitude: this.data.formLat,
      longitude: this.data.formLng,
      period: this.data.formPeriod,
      notes: this.data.formNotes,
      date: this.data.formDate
    };

    const promise = editingId
      ? api.updateSchedule(bookId, editingId, scheduleData)
      : api.createSchedule(bookId, scheduleData);

    promise.then(() => {
      wx.showToast({ title: editingId ? '行程已更新' : '行程已添加', icon: 'success' });
      this.setData({ showFormPopup: false });
      this.loadData();
    }).catch(err => {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    });
  },

  onTabChange(e) {
    const { key } = e.detail;
    const routes = {
      bill: '/pages/book/bill/index',
      schedule: '/pages/book/schedule/index',
      statistics: '/pages/book/statistics/index'
    };
    wx.redirectTo({ url: `${routes[key]}?id=${this.data.bookId}` });
  }
});
