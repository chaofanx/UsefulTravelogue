const api = require('../../utils/api');

Page({
  data: {
    isEdit: false,
    bookId: 0,
    billId: 0,
    amount: '',
    selectedCategory: '',
    selectedPayer: '',
    remark: '',
    categories: [
      { name: '餐饮', icon: '🍽️' },
      { name: '交通', icon: '🚗' },
      { name: '住宿', icon: '🏨' },
      { name: '娱乐', icon: '🎮' },
      { name: '门票', icon: '🎫' },
      { name: '购物', icon: '🛍️' },
      { name: '其他', icon: '📦' }
    ],
    payers: [],
    loading: false
  },

  onLoad(options) {
    const bookId = Number(options.bookId) || 1;
    const billId = Number(options.billId) || 0;
    this.data.bookId = bookId;
    this.data.billId = billId;

    api.getBook(bookId).then(book => {
      const members = (book && book.members) ? book.members : [];
      const payers = members.map(m => m.name);
      const defaultPayer = payers.length > 0 ? payers[0] : '';

      if (billId) {
        api.getBills(bookId).then(billsData => {
          const allBills = (billsData && billsData.groups)
            ? billsData.groups.reduce((arr, g) => arr.concat(g.bills || []), [])
            : [];
          const bill = allBills.find(b => b.id === billId);
          if (bill) {
            this.setData({
              isEdit: true,
              amount: String(bill.amount),
              selectedCategory: bill.category || '',
              selectedPayer: bill.payer || '',
              remark: bill.remark || '',
              payers
            });
          } else {
            this.setData({ selectedPayer: defaultPayer, payers });
          }
        }).catch(() => {
          this.setData({ selectedPayer: defaultPayer, payers });
        });
      } else {
        this.setData({ selectedPayer: defaultPayer, payers });
      }
    }).catch(() => {});
  },

  onBack() {
    wx.navigateBack();
  },

  onAmountInput(e) {
    this.setData({ amount: e.detail.value });
  },

  onCategoryTap(e) {
    this.setData({ selectedCategory: e.currentTarget.dataset.name });
  },

  onPayerTap(e) {
    this.setData({ selectedPayer: e.currentTarget.dataset.name });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  onSubmit() {
    const { amount, selectedCategory, selectedPayer, remark, isEdit, bookId, billId } = this.data;
    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({ title: '请输入金额', icon: 'none' });
      return;
    }
    if (!selectedCategory) {
      wx.showToast({ title: '请选择分类', icon: 'none' });
      return;
    }
    if (!selectedPayer) {
      wx.showToast({ title: '请选择付款人', icon: 'none' });
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const billData = {
      category: selectedCategory,
      amount: parseFloat(amount),
      payer: selectedPayer,
      remark: remark || '',
      date: todayStr,
      time: timeStr
    };

    const promise = isEdit
      ? api.updateBill(bookId, billId, billData)
      : api.createBill(bookId, billData);

    this.setData({ loading: true });
    promise.then(() => {
      wx.showToast({ title: isEdit ? '账单已更新' : '记账成功！', icon: 'success' });
      this.setData({ loading: false });
      setTimeout(() => wx.navigateBack(), 1000);
    }).catch(err => {
      this.setData({ loading: false });
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    });
  },

  onDeleteBill() {
    const { bookId, billId } = this.data;
    wx.showModal({
      title: '删除账单',
      content: '确定要删除这笔账单吗？',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          api.deleteBill(bookId, billId).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1000);
          }).catch(err => {
            wx.showToast({ title: err.message || '删除失败', icon: 'none' });
          });
        }
      }
    });
  }
});
