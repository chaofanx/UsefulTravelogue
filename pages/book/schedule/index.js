const api = require('../../../utils/api');
const { formatDateShort } = require('../../../utils/util');

function getTodayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
    this.setData({ loading: true });
    Promise.all([
      api.getBook(this.data.bookId),
      api.getSchedules(this.data.bookId)
    ]).then(([book, schedulesData]) => {
      const scheduleGroups = (schedulesData && schedulesData.groups)
        ? schedulesData.groups
        : [];
      const groupedSchedules = scheduleGroups.map(group => ({
        ...group,
        monthDay: formatDateShort(group.date)
      }));
      this.setData({ book: book || {}, groupedSchedules, loading: false });
    }).catch(err => {
      this.setData({ loading: false });
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    });
  },

  onBookChange(e) {
    this.setData({ book: e.detail.book });
  },

  resetForm() {
    this.setData({
      editingId: null,
      formLocation: '',
      formAddress: '',
      formLat: null,
      formLng: null,
      formPeriod: '全天',
      formNotes: ''
    });
  },

  onScheduleEdit(e) {
    const item = e.detail.item;
    this.setData({
      showFormPopup: true,
      editingId: item.id,
      formLocation: item.location || '',
      formAddress: item.address || '',
      formLat: item.latitude || null,
      formLng: item.longitude || null,
      formPeriod: item.period || '全天',
      formNotes: item.notes || ''
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

  onNotesInput(e) {
    this.setData({ formNotes: e.detail.value });
  },

  onCancelForm() {
    this.setData({ showFormPopup: false });
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
      date: getTodayStr()
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
  },

  onShareAppMessage() {
    return {
      title: `${this.data.book.title} - 旅行行程`,
      path: `/pages/book/schedule/index?id=${this.data.bookId}`
    };
  }
});
