const api = require('../../utils/api');
const { getCapsuleInfo } = require('../../utils/capsule');

const DEFAULT_COLORS = ['#4A90D9', '#FF6B6B', '#38C172', '#FFD93D', '#6C5CE7', '#FF8C42', '#45B7D1', '#96CEB4'];

Component({
  properties: {
    book: {
      type: Object,
      value: {}
    }
  },

  data: {
    memberCount: 0,
    showSettingPopup: false,
    showRenamePopup: false,
    showAddMemberPopup: false,
    editName: '',
    newMemberName: '',
    memberAliases: {},
    navBarHeight: 88,
    statusBarHeight: 44,
    menuTop: 40,
    menuRight: 16,
    menuHeight: 64,
    capsuleLeft: 200,
  },

  lifetimes: {
    attached() {
      const info = getCapsuleInfo();
      this.setData({
        navBarHeight: info.navBarHeight,
        statusBarHeight: info.statusBarHeight,
        menuTop: info.menuTop,
        menuRight: info.menuRight,
        menuHeight: info.menuHeight,
        capsuleLeft: info.capsuleLeft,
      });
    }
  },

  observers: {
    'book'(book) {
      if (book && book.members) {
        this.setData({
          memberCount: book.members.length,
          memberAliases: book.memberAliases || {},
        });
      }
    }
  },

  methods: {
    syncBook(bookData) {
      const bookId = this.data.book.id;
      api.updateBook(bookId, bookData).then(updatedBook => {
        this.setData({ book: updatedBook || { ...this.data.book, ...bookData } });
        this.triggerEvent('bookchange', { book: updatedBook || this.data.book });
      }).catch(err => {
        wx.showToast({ title: err.message || '操作失败', icon: 'none' });
      });
    },

    onBack() {
      wx.navigateBack();
    },

    onVip() {
      wx.navigateTo({ url: '/pages/profile/index' });
    },

    onOpenSetting() {
      this.setData({ showSettingPopup: true });
    },

    onSettingPopupVisible(e) {
      this.setData({ showSettingPopup: e.detail.visible });
    },

    onChangeCover() {
      const that = this;
      this.setData({ showSettingPopup: false });
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success(res) {
          const tempFilePath = res.tempFiles[0].tempFilePath;
          api.updateBook(that.data.book.id, { cover: tempFilePath }).then(updatedBook => {
            that.setData({ book: updatedBook || { ...that.data.book, cover: tempFilePath } });
            that.triggerEvent('bookchange', { book: updatedBook || that.data.book });
            wx.showToast({ title: '封面已更新', icon: 'success' });
          }).catch(err => {
            wx.showToast({ title: err.message || '更新失败', icon: 'none' });
          });
        }
      });
    },

    onChangeName() {
      this.setData({
        showSettingPopup: false,
        showRenamePopup: true,
        editName: this.data.book.title
      });
    },

    onRenamePopupVisible(e) {
      this.setData({ showRenamePopup: e.detail.visible });
    },

    onEditNameInput(e) {
      this.setData({ editName: e.detail.value });
    },

    onCancelRename() {
      this.setData({ showRenamePopup: false });
    },

    onConfirmRename() {
      const name = this.data.editName.trim();
      if (!name) {
        wx.showToast({ title: '请输入名称', icon: 'none' });
        return;
      }
      this.setData({ showRenamePopup: false });
      this.syncBook({ title: name });
      wx.showToast({ title: '名称已更新', icon: 'success' });
    },

    onAddMember() {
      this.setData({
        showSettingPopup: false,
        showAddMemberPopup: true,
        newMemberName: ''
      });
    },

    onAddMemberPopupVisible(e) {
      this.setData({ showAddMemberPopup: e.detail.visible });
    },

    onNewMemberInput(e) {
      this.setData({ newMemberName: e.detail.value });
    },

    onConfirmAddMember() {
      const name = this.data.newMemberName.trim();
      if (!name) {
        wx.showToast({ title: '请输入成员名', icon: 'none' });
        return;
      }
      const exists = this.data.book.members.some(m => m.name === name);
      if (exists) {
        wx.showToast({ title: '成员已存在', icon: 'none' });
        return;
      }

      api.addMember(this.data.book.id, { nickname: name }).then(newMember => {
        const book = {
          ...this.data.book,
          members: [...this.data.book.members, newMember]
        };
        this.setData({ book, newMemberName: '' });
        this.triggerEvent('bookchange', { book });
        wx.showToast({ title: '成员已添加', icon: 'success' });
      }).catch(err => {
        wx.showToast({ title: err.message || '添加失败', icon: 'none' });
      });
    },

    onRemoveMember(e) {
      const memberId = e.currentTarget.dataset.id;
      wx.showModal({
        title: '移除成员',
        content: '确定要移除此成员吗？',
        success: (res) => {
          if (res.confirm) {
            api.removeMember(this.data.book.id, memberId).then(() => {
              const book = {
                ...this.data.book,
                members: this.data.book.members.filter(m => m.id !== memberId)
              };
              this.setData({ book });
              this.triggerEvent('bookchange', { book });
              wx.showToast({ title: '成员已移除', icon: 'success' });
            }).catch(err => {
              wx.showToast({ title: err.message || '移除失败', icon: 'none' });
            });
          }
        }
      });
    },

    onAliasInput(e) {
      const name = e.currentTarget.dataset.name;
      const value = e.detail.value;
      const aliases = { ...this.data.memberAliases };
      if (value) {
        aliases[name] = value;
      } else {
        delete aliases[name];
      }
      this.setData({ memberAliases: aliases });
    },

    onResetAlias(e) {
      const name = e.currentTarget.dataset.name;
      const aliases = { ...this.data.memberAliases };
      delete aliases[name];
      this.setData({ memberAliases: aliases });
    },

    onSaveAliases() {
      const bookId = this.data.book.id;
      const aliases = this.data.memberAliases;
      const payload = {};
      Object.keys(aliases).forEach(k => {
        if (aliases[k]) payload[k] = aliases[k];
      });

      api.updateBookAliases(bookId, payload).then(updatedBook => {
        this.setData({ book: updatedBook || { ...this.data.book, memberAliases: aliases } });
        this.triggerEvent('bookchange', { book: updatedBook || this.data.book });
        wx.showToast({ title: '别名已保存', icon: 'success' });
      }).catch(err => {
        wx.showToast({ title: err.message || '保存失败', icon: 'none' });
      });
    },

    onDisbandBook() {
      this.setData({ showSettingPopup: false });
      wx.showModal({
        title: '解散账本',
        content: '确定要解散该账本吗？此操作不可撤销。',
        confirmText: '解散',
        confirmColor: '#FF6B6B',
        success: (res) => {
          if (res.confirm) {
            api.deleteBook(this.data.book.id).then(() => {
              wx.showToast({ title: '账本已解散', icon: 'success' });
              setTimeout(() => {
                wx.navigateBack();
              }, 1200);
            }).catch(err => {
              wx.showToast({ title: err.message || '操作失败', icon: 'none' });
            });
          }
        }
      });
    },

    onMemberTap() {
      wx.navigateTo({ url: `/pages/memberList/index?bookId=${this.data.book.id}` });
    },

    onShareTap() {
      this.triggerEvent('share');
    }
  }
});
