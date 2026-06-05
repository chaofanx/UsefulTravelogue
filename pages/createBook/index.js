const api = require('../../utils/api');

Page({
  data: {
    name: '',
    date: '',
    coverColor: '#4A90D9',
    memberInput: '',
    members: [],
    colors: ['#4A90D9', '#FF6B6B', '#38C172', '#FFD93D', '#6C5CE7', '#FF8C42', '#45B7D1', '#96CEB4']
  },

  onLoad() {
    const userInfo = getApp().globalData.userInfo;
    if (userInfo && userInfo.nickname) {
      this.setData({ members: [userInfo.nickname] });
    }
  },

  onBack() {
    wx.navigateBack();
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  onColorTap(e) {
    this.setData({ coverColor: e.currentTarget.dataset.color });
  },

  onMemberInput(e) {
    this.setData({ memberInput: e.detail.value });
  },

  onAddMember() {
    const member = this.data.memberInput.trim();
    if (member && !this.data.members.includes(member)) {
      this.setData({
        members: [...this.data.members, member],
        memberInput: ''
      });
    } else if (member && this.data.members.includes(member)) {
      wx.showToast({ title: '成员已存在', icon: 'none' });
    }
  },

  onRemoveMember(e) {
    const index = e.currentTarget.dataset.index;
    const members = [...this.data.members];
    members.splice(index, 1);
    this.setData({ members });
  },

  onSubmit() {
    const { name, date, coverColor, members } = this.data;
    if (!name) {
      wx.showToast({ title: '请输入账本名称', icon: 'none' });
      return;
    }
    api.createBook({
      title: name.trim(),
      coverColor: coverColor,
      date: date || this.getCurrentMonth()
    }).then(() => {
      wx.showToast({ title: '创建成功！', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    }).catch(err => {
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    });
  },

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}年${now.getMonth() + 1}月`;
  }
});
