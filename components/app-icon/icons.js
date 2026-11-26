// 24x24 网格，统一线性描边（stroke-width 在组件里设置）。
// 每个图标是若干 path 的 d 字符串；fill 数组标记哪些 path 在 active 状态下填充。
module.exports = {
  // 账单：小票
  bill: {
    paths: ['M6 3h12v18l-3-2-3 2-3-2-3 2V3z', 'M9 8h6', 'M9 12h6'],
    fill: [0]
  },
  // 行程：日历
  schedule: {
    paths: ['M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z', 'M8 2.5v3', 'M16 2.5v3', 'M4 10h16'],
    fill: [0]
  },
  // 分账：饼图
  statistics: {
    paths: ['M21 12a9 9 0 1 1-9-9', 'M12 3v9h9'],
    fill: [0]
  }
};
