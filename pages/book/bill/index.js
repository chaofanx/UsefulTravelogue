const api = require('../../../utils/api');
const cache = require('../../../utils/cache');
const { generateShareImage } = require('../../../utils/shareImage');
const { dateToStr } = require('../../../utils/util');
const { parseBookId, switchBookTab, inviteShare } = require('../../../utils/bookPage');

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
    formCurrency: 'CNY',
    currencySymbol: '¥',
    currencyIndex: 0,
    currencies: [{ code: 'CNY', name: '人民币', symbol: '¥', rate: 1 }],
    currencyLabels: ['人民币 CNY'],
    convertText: '',
    editRate: 0,
    editCurrency: '',
    formCategory: '',
    formPayerId: '',
    formParticipants: [],
    participantMap: {},
    formRemark: '',
    formDate: '',
    formIcon: '',
    formExclude: false,
    todayStr: '',
    yesterdayStr: '',
    members: [],
    // 兜底默认值，与后端 CATEGORY_EMOJI_MAP 保持一致；运行时以 /system/categories 为准
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
    const bookId = parseBookId(options.id);
    if (!bookId) return;
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

    // 币种与汇率：仅用于表单折算预览，入账汇率以后端为准；失败时只能记人民币
    const ratesKey = cache.keys.exchangeRates();
    const cachedRates = cache.get(ratesKey);
    if (cachedRates !== undefined) this.applyCurrencies(cachedRates);
    cache.fetchAndCache(ratesKey, () => api.getExchangeRates()).then(data => {
      this.applyCurrencies(data);
    }).catch(() => {});

    // 分类以后端为准；data.categories 里的默认值仅用于首次请求返回前/请求失败时兜底
    const catKey = cache.keys.categories();
    const cachedCats = cache.get(catKey);
    if (cachedCats !== undefined && cachedCats.categories) {
      this.setData({ categories: cachedCats.categories });
    }
    cache.fetchAndCache(catKey, () => api.getSystemCategories()).then(data => {
      if (data && data.categories && data.categories.length) {
        this.setData({ categories: data.categories });
      }
    }).catch(() => {});
  },

  loadData() {
    const bookId = this.data.bookId;
    cache.load(this, [
      { key: cache.keys.book(bookId), fetch: () => api.getBook(bookId) },
      { key: cache.keys.bills(bookId), fetch: () => api.getBills(bookId) }
    ], (book, billsData) => this.applyData(book, billsData));
  },

  applyData(book, billsData) {
    const members = (book && book.members) ? book.members : [];
    const memberAliases = (book && book.memberAliases) ? book.memberAliases : {};
    const groupedBills = (billsData && billsData.groups) ? billsData.groups : [];
    this.setData({ book: book || {}, groupedBills, members, memberAliases, loading: false });
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

  applyCurrencies(data) {
    const list = (data && data.currencies) ? data.currencies : [];
    if (list.length === 0) return;
    const index = Math.max(0, list.findIndex(c => c.code === this.data.formCurrency));
    this.setData({
      currencies: list,
      currencyLabels: list.map(c => `${c.name} ${c.code}`),
      currencyIndex: index
    });
    this.refreshConvert();
  },

  // 刷新币种符号和「≈ ¥xx」折算预览；编辑同币种账单时沿用记账时的汇率快照
  refreshConvert() {
    const { formCurrency, formAmount, currencies, editCurrency, editRate } = this.data;
    const cur = currencies.find(c => c.code === formCurrency);
    if (!cur || cur.code === 'CNY') {
      this.setData({ currencySymbol: '¥', convertText: '' });
      return;
    }
    const rate = (editCurrency === formCurrency && editRate) ? editRate : cur.rate;
    const amount = parseFloat(formAmount);
    const rateText = `1 ${cur.code} ≈ ¥${Number(rate.toPrecision(4))}`;
    this.setData({
      currencySymbol: cur.symbol,
      convertText: amount > 0 ? `≈ ¥${(amount * rate).toFixed(2)}（${rateText}）` : rateText
    });
  },

  onCurrencyChange(e) {
    const index = Number(e.detail.value);
    const cur = this.data.currencies[index];
    if (!cur) return;
    this.setData({ currencyIndex: index, formCurrency: cur.code });
    this.refreshConvert();
  },

  buildParticipantMap(list) {
    const map = {};
    (list || []).forEach(n => { map[n] = true; });
    return map;
  },

  // 账单里的付款人/分摊人以成员 ID 标识；历史账单缺 ID 时按昵称回退匹配
  namesToIds(names) {
    const byName = {};
    this.data.members.forEach(m => { byName[m.name] = m.id; });
    return (names || []).map(n => byName[n]).filter(Boolean);
  },

  resetForm() {
    const participants = this.data.members.map(m => m.id);
    const now = new Date();
    const todayStr = dateToStr(now);
    const yesterdayStr = dateToStr(new Date(now.getTime() - 86400000));
    this.setData({
      editingId: null,
      formAmount: '',
      formCurrency: 'CNY',
      currencyIndex: 0,
      editRate: 0,
      editCurrency: '',
      formCategory: '',
      formPayerId: this.data.members.length > 0 ? this.data.members[0].id : '',
      formParticipants: participants,
      participantMap: this.buildParticipantMap(participants),
      formRemark: '',
      formDate: todayStr,
      formIcon: '',
      formExclude: false,
      todayStr,
      yesterdayStr
    });
    this.refreshConvert();
  },

  onAddBill() {
    this.resetForm();
    this.setData({ showFormPopup: true });
  },

  onBillTap(e) {
    const bill = e.detail.bill;
    let participants = bill.splitMemberIds;
    if (!participants || participants.length === 0) {
      participants = (bill.splitParticipants && bill.splitParticipants.length > 0)
        ? this.namesToIds(bill.splitParticipants)
        : this.data.members.map(m => m.id);
    }
    const payerId = bill.payerMemberId || this.namesToIds([bill.payer])[0] || '';
    const now = new Date();
    const todayStr = dateToStr(now);
    const yesterdayStr = dateToStr(new Date(now.getTime() - 86400000));
    // 「其他」分类的自定义 emoji 直接存在 icon 字段（区别于 'other' 等内置图标名）
    const customIcon = (bill.category === '其他' && bill.icon && bill.icon !== 'other') ? bill.icon : '';
    this.setData({
      showFormPopup: true,
      editingId: bill.id,
      // 非人民币账单回显原币种金额，保存时后端沿用记账时的汇率快照
      formAmount: String((bill.currency && bill.currency !== 'CNY' && bill.originalAmount != null ? bill.originalAmount : bill.amount) || ''),
      formCurrency: bill.currency || 'CNY',
      currencyIndex: Math.max(0, this.data.currencies.findIndex(c => c.code === (bill.currency || 'CNY'))),
      editCurrency: bill.currency || 'CNY',
      editRate: bill.exchangeRate || 0,
      formCategory: bill.category || '',
      formPayerId: payerId,
      formParticipants: participants,
      participantMap: this.buildParticipantMap(participants),
      formRemark: bill.remark || '',
      formDate: bill.date || todayStr,
      formIcon: customIcon,
      formExclude: !!bill.excludeFromSplit,
      todayStr,
      yesterdayStr
    });
    this.refreshConvert();
  },

  onFormPopupVisible(e) {
    if (!e.detail.visible) {
      this.setData({ showFormPopup: false });
    }
  },

  onAmountInput(e) {
    this.setData({ formAmount: e.detail.value });
    this.refreshConvert();
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
    this.setData({ formPayerId: e.currentTarget.dataset.id });
  },

  onParticipantTap(e) {
    const id = e.currentTarget.dataset.id;
    let participants = [...this.data.formParticipants];
    const idx = participants.indexOf(id);
    if (idx >= 0) {
      participants.splice(idx, 1);
    } else {
      participants.push(id);
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
      formAmount, formCurrency, formCategory, formPayerId, formParticipants, formRemark,
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
    if (!formPayerId) {
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
      currency: formCurrency,
      payerMemberId: formPayerId,
      date: formDate || dateToStr(now),
      time: timeStr,
      splitMemberIds: formParticipants,
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
    switchBookTab(this.data.bookId, e.detail.key);
  },

  onShareAppMessage() {
    // 指向邀请落地页，好友打开后可直接加入账本
    const share = inviteShare(this.data.book, this.data.bookId);
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
