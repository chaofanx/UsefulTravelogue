const api = require('../../../utils/api');

Page({
  data: {
    bookId: 0,
    book: {},
    groupedBills: [],
    loading: true,
    memberAliases: {},

    // 表单弹层
    showFormPopup: false,
    editingId: null,
    formAmount: '',
    formCategory: '',
    formPayer: '',
    formParticipants: [],
    participantMap: {},
    formRemark: '',
    payers: [],
    categories: [
      { name: '餐饮', icon: '🍽️' },
      { name: '交通', icon: '🚗' },
      { name: '住宿', icon: '🏨' },
      { name: '娱乐', icon: '🎮' },
      { name: '门票', icon: '🎫' },
      { name: '购物', icon: '🛍️' },
      { name: '其他', icon: '📦' }
    ]
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

  onShow() {
    this.loadData();
  },

  loadData() {
    this.setData({ loading: true });
    Promise.all([
      api.getBook(this.data.bookId),
      api.getBills(this.data.bookId)
    ]).then(([book, billsData]) => {
      const members = (book && book.members) ? book.members : [];
      const payers = members.map(m => m.name);
      const memberAliases = (book && book.memberAliases) ? book.memberAliases : {};
      const groupedBills = (billsData && billsData.groups) ? billsData.groups : [];
      this.setData({ book: book || {}, groupedBills, payers, memberAliases, loading: false });
    }).catch(err => {
      this.setData({ loading: false });
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    });
  },

  onBookChange(e) {
    this.setData({ book: e.detail.book });
  },

  // ========== 表单弹层 ==========

  buildParticipantMap(list) {
    const map = {};
    (list || []).forEach(n => { map[n] = true; });
    return map;
  },

  resetForm() {
    const participants = [...this.data.payers];
    this.setData({
      editingId: null,
      formAmount: '',
      formCategory: '',
      formPayer: this.data.payers.length > 0 ? this.data.payers[0] : '',
      formParticipants: participants,
      participantMap: this.buildParticipantMap(participants),
      formRemark: ''
    });
  },

  onAddBill() {
    this.resetForm();
    this.setData({ showFormPopup: true });
  },

  onBillTap(e) {
    const bill = e.detail.bill;
    const participants = bill.splitParticipants || [...this.data.payers];
    this.setData({
      showFormPopup: true,
      editingId: bill.id,
      formAmount: String(bill.amount || ''),
      formCategory: bill.category || '',
      formPayer: bill.payer || '',
      formParticipants: participants,
      participantMap: this.buildParticipantMap(participants),
      formRemark: bill.remark || ''
    });
  },

  onFormPopupVisible(e) {
    if (!e.detail.visible) {
      this.setData({ showFormPopup: false });
    }
  },

  onAmountInput(e) {
    this.setData({ formAmount: e.detail.value });
  },

  onCategoryTap(e) {
    this.setData({ formCategory: e.currentTarget.dataset.name });
  },

  onPayerTap(e) {
    this.setData({ formPayer: e.currentTarget.dataset.name });
  },

  onParticipantTap(e) {
    const name = e.currentTarget.dataset.name;
    let participants = [...this.data.formParticipants];
    const idx = participants.indexOf(name);
    if (idx >= 0) {
      participants.splice(idx, 1);
    } else {
      participants.push(name);
    }
    this.setData({
      formParticipants: participants,
      participantMap: this.buildParticipantMap(participants)
    });
  },

  onRemarkInput(e) {
    this.setData({ formRemark: e.detail.value });
  },

  onCancelForm() {
    this.setData({ showFormPopup: false });
  },

  onConfirmBill() {
    const { formAmount, formCategory, formPayer, formParticipants, formRemark, editingId, bookId } = this.data;
    if (!formAmount || parseFloat(formAmount) <= 0) {
      wx.showToast({ title: '请输入金额', icon: 'none' });
      return;
    }
    if (!formCategory) {
      wx.showToast({ title: '请选择分类', icon: 'none' });
      return;
    }
    if (!formPayer) {
      wx.showToast({ title: '请选择付款人', icon: 'none' });
      return;
    }
    if (formParticipants.length === 0) {
      wx.showToast({ title: '请至少选择一位参与分摊的人', icon: 'none' });
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const billData = {
      category: formCategory,
      amount: parseFloat(formAmount),
      payer: formPayer,
      remark: formRemark || '',
      date: todayStr,
      time: timeStr,
      splitParticipants: formParticipants,
    };

    const promise = editingId
      ? api.updateBill(bookId, editingId, billData)
      : api.createBill(bookId, billData);

    promise.then(() => {
      wx.showToast({ title: editingId ? '账单已更新' : '记账成功！', icon: 'success' });
      this.setData({ showFormPopup: false });
      this.loadData();
    }).catch(err => {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    });
  },

  onDeleteBill() {
    const { editingId, bookId } = this.data;
    if (!editingId) return;

    wx.showModal({
      title: '删除账单',
      content: '确定要删除这笔账单吗？',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          api.deleteBill(bookId, editingId).then(() => {
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

  // ========== 其他 ==========

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
