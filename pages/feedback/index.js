const api = require('../../utils/api');

Page({
  data: {
    types: ['功能建议', 'Bug反馈', '使用问题', '其他'],
    selectedType: '功能建议',
    content: '',
    submitting: false
  },

  onTypeTap(e) {
    this.setData({ selectedType: e.currentTarget.dataset.type });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onSubmit() {
    if (!this.data.content.trim()) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    api.submitFeedback({
      type: this.data.selectedType,
      content: this.data.content.trim()
    }).then(() => {
      wx.showToast({ title: '感谢反馈！', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    }).catch(err => {
      this.setData({ submitting: false });
      wx.showToast({ title: err.message || '提交失败', icon: 'none' });
    });
  }
});
