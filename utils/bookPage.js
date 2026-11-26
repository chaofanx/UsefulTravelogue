// 账本相关页面的公共小工具（原先在 bill/schedule/statistics/... 各抄一份）。

const BOOK_TAB_ROUTES = {
  bill: '/pages/book/bill/index',
  schedule: '/pages/book/schedule/index',
  statistics: '/pages/book/statistics/index'
};

// 解析页面参数里的账本 id；无效时提示并返回上一页，返回 0。
function parseBookId(raw) {
  const id = Number(raw);
  if (!id) {
    wx.showToast({ title: '参数错误', icon: 'none' });
    wx.navigateBack();
    return 0;
  }
  return id;
}

// 账本底部 tab 切换（custom-tab-bar 的 change 事件）
function switchBookTab(bookId, key) {
  wx.redirectTo({ url: `${BOOK_TAB_ROUTES[key]}?id=${bookId}` });
}

// 邀请好友加入账本的分享内容（落地页：bookDetail，带 invite=1）
function inviteShare(book, bookId) {
  return {
    title: `邀请你加入「${(book && book.title) || '旅行'}」账本`,
    path: `/pages/bookDetail/index?id=${bookId}&invite=1`
  };
}

module.exports = { parseBookId, switchBookTab, inviteShare };
