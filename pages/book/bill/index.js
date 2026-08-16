const api = require('../../../utils/api');
const cache = require('../../../utils/cache');
const { generateShareImage } = require('../../../utils/shareImage');

function dateToStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

Page({
  data: {
    bookId: 0,
    book: {},
    groupedBills: [],
    loading: true,
    memberAliases: {},
    isVip: false,
    otherEmojis: [],

    // 表单弹层
    showFormPopup: false,
    editingId: null,
    formAmount: '',
    formCategory: '',
    formPayer: '',
    formParticipants: [],
    participantMap: {},
    formRemark: '',
    formDate: '',
    formIcon: '',
    formExclude: false,
    todayStr: '',
    yesterdayStr: '',
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
    this.loadVipAndEmojis();
  },

  onShow() {
    this.loadData();
  },

  // 获取会员状态（决定备注/不计分账控件显隐）和「其他」分类可选 emoji
  loadVipAndEmojis() {
    const profileKey = cache.keys.profile();
    const cachedProfile = cache.get(profileKey);
    if (cachedProfile !== undefined) {
      this.setData({ isVip: !!(cachedProfile && cachedProfile.vip) });
    }
    cache.fetchAndCache(profileKey, () => api.getUserProfile()).then(profile => {
      this.setData({ isVip: !!(profile && profile.vip) });
    }).catch(() => {});

    const emojisKey = cache.keys.emojis();
    const cachedEmojis = cache.get(emojisKey);
    if (cachedEmojis !== undefined) {
      this.setData({ otherEmojis: (cachedEmojis && cachedEmojis.emojis) || [] });
    }
    cache.fetchAndCache(emojisKey, () => api.getSystemEmojis()).then(data => {
      this.setData({ otherEmojis: (data && data.emojis) || [] });
    }).catch(() => {});
  },

  loadData() {
    const bookId = this.data.bookId;
    const bookKey = cache.keys.book(bookId);
    const billsKey = cache.keys.bills(bookId);
    const cachedBook = cache.get(bookKey);
    const cachedBills = cache.get(billsKey);
    if (cachedBook !== undefined && cachedBills !== undefined) {
      // 先渲染缓存，后台请求回来后再更新
      this.applyData(cachedBook, cachedBills);
    } else {
      this.setData({ loading: true });
    }
    Promise.all([
      cache.fetchAndCache(bookKey, () => api.getBook(bookId)),
      cache.fetchAndCache(billsKey, () => api.getBills(bookId))
    ]).then(([book, billsData]) => {
      this.applyData(book, billsData);
    }).catch(err => {
      this.setData({ loading: false });
      wx.showToast({
        title: (cachedBook !== undefined && cachedBills !== undefined)
          ? '数据更新失败，当前为缓存数据'
          : (err.message || '加载失败'),
        icon: 'none'
      });
    });
  },

  applyData(book, billsData) {
    const members = (book && book.members) ? book.members : [];
    const payers = members.map(m => m.name);
    const memberAliases = (book && book.memberAliases) ? book.memberAliases : {};
    const groupedBills = (billsData && billsData.groups) ? billsData.groups : [];
    this.setData({ book: book || {}, groupedBills, payers, memberAliases, loading: false });
    this.refreshShareImage();
  },

  onBookChange(e) {
    this.setData({ book: e.detail.book });
    this.refreshShareImage();
  },

  // 生成分享封面图（账本封面 + 左下角账本名），供 onShareAppMessage 使用
  refreshShareImage() {
    const book = this.data.book;
    if (!book || !book.id) return;
    // 标题/封面/底色都没变时不重复生成；失败不记 key，下次自动重试
    const key = [book.id, book.title, book.cover, book.coverColor].join('|');
    if (key === this._shareImgKey || key === this._shareImgPendingKey) return;
    this._shareImgPendingKey = key;

    this._shareImgReady = generateShareImage(this, book).then(path => {
      this._shareImgPendingKey = '';
      this.shareImageUrl = path;
      this._shareImgKey = key;
      return path;
    }).catch(() => {
      this._shareImgPendingKey = '';
      this.shareImageUrl = '';
      return '';
    });
  },

  // ========== 表单弹层 ==========

  buildParticipantMap(list) {
    const map = {};
    (list || []).forEach(n => { map[n] = true; });
    return map;
  },

  resetForm() {
    const participants = [...this.data.payers];
    const now = new Date();
    const todayStr = dateToStr(now);
    const yesterdayStr = dateToStr(new Date(now.getTime() - 86400000));
    this.setData({
      editingId: null,
      formAmount: '',
      formCategory: '',
      formPayer: this.data.payers.length > 0 ? this.data.payers[0] : '',
      formParticipants: participants,
      participantMap: this.buildParticipantMap(participants),
      formRemark: '',
      formDate: todayStr,
      formIcon: '',
      formExclude: false,
      todayStr,
      yesterdayStr
    });
  },

  onAddBill() {
    this.resetForm();
    this.setData({ showFormPopup: true });
  },

  onBillTap(e) {
    const bill = e.detail.bill;
    const participants = bill.splitParticipants || [...this.data.payers];
    const now = new Date();
    const todayStr = dateToStr(now);
    const yesterdayStr = dateToStr(new Date(now.getTime() - 86400000));
    // 「其他」分类的自定义 emoji 直接存在 icon 字段（区别于 'other' 等内置图标名）
    const customIcon = (bill.category === '其他' && bill.icon && bill.icon !== 'other') ? bill.icon : '';
    this.setData({
      showFormPopup: true,
      editingId: bill.id,
      formAmount: String(bill.amount || ''),
      formCategory: bill.category || '',
      formPayer: bill.payer || '',
      formParticipants: participants,
      participantMap: this.buildParticipantMap(participants),
      formRemark: bill.remark || '',
      formDate: bill.date || todayStr,
      formIcon: customIcon,
      formExclude: !!bill.excludeFromSplit,
      todayStr,
      yesterdayStr
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
    const name = e.currentTarget.dataset.name;
    this.setData({
      formCategory: name,
      // 切换出「其他」分类时清掉自定义 emoji
      formIcon: name === '其他' ? this.data.formIcon : ''
    });
  },

  onDateQuick(e) {
    this.setData({ formDate: e.currentTarget.dataset.date });
  },

  onDatePick(e) {
    this.setData({ formDate: e.detail.value });
  },

  onEmojiTap(e) {
    const emoji = e.currentTarget.dataset.emoji;
    this.setData({ formIcon: this.data.formIcon === emoji ? '' : emoji });
  },

  onExcludeChange(e) {
    this.setData({ formExclude: !!e.detail.value });
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
    const {
      formAmount, formCategory, formPayer, formParticipants, formRemark,
      formDate, formIcon, formExclude, isVip, editingId, bookId
    } = this.data;
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

    const billData = {
      category: formCategory,
      amount: parseFloat(formAmount),
      payer: formPayer,
      date: formDate || dateToStr(now),
      time: timeStr,
      splitParticipants: formParticipants,
    };
    if (formCategory === '其他' && formIcon) {
      billData.icon = formIcon;
    }
    // 备注与不计入分账为高级会员功能，普通用户不携带这些字段
    if (isVip) {
      billData.remark = formRemark || '';
      billData.excludeFromSplit = formExclude;
    }

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
    const share = {
      title: `邀请你加入「${this.data.book.title || '旅行'}」账本`,
      // 指向邀请落地页，好友打开后可直接加入账本
      path: `/pages/bookDetail/index?id=${this.data.bookId}&invite=1`
    };
    if (this.shareImageUrl) {
      return { ...share, imageUrl: this.shareImageUrl };
    }
    // 分享图尚未生成完时，通过 promise 异步返回（基础库 2.10+ 支持）
    if (this._shareImgReady) {
      return {
        ...share,
        promise: this._shareImgReady.then(imageUrl => (imageUrl ? { ...share, imageUrl } : share))
      };
    }
    return share;
  }
});
