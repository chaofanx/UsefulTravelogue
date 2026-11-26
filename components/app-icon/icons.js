// 24x24 网格，统一线性描边（stroke-width 在组件里设置）。
// paths: path 的 d 字符串列表；fill: active 状态下需要浅色填充的 path 下标（可选）。

function circle(cx, cy, r) {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
}

module.exports = {
  // —— 底部 tab ——
  bill: {
    paths: ['M6 3h12v18l-3-2-3 2-3-2-3 2V3z', 'M9 8h6', 'M9 12h6'],
    fill: [0]
  },
  schedule: {
    paths: ['M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z', 'M8 2.5v3', 'M16 2.5v3', 'M4 10h16'],
    fill: [0]
  },
  statistics: {
    paths: ['M12 12V3a9 9 0 1 0 9 9z'],
    fill: [0]
  },

  // —— 界面图标 ——
  vip: { paths: ['M7 4h10l4 5-9 11L3 9z', 'M3 9h18', 'M10 4 8.5 9 12 20', 'M14 4l1.5 5L12 20'] },
  settings: {
    paths: ['M4 6h9', 'M17 6h3', circle(15, 6, 2), 'M4 12h3', 'M11 12h9', circle(9, 12, 2), 'M4 18h11', 'M19 18h1', circle(17, 18, 2)]
  },
  info: { paths: [circle(12, 12, 9), 'M12 11v5', 'M12 7.8h.01'] },
  chat: {
    paths: ['M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H11l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M8 9h8', 'M8 12.5h5']
  },
  chart: { paths: ['M4 20h16', 'M7 20v-6', 'M12 20V6', 'M17 20v-10'] },
  user: { paths: [circle(12, 8, 4), 'M4 21a8 8 0 0 1 16 0'] },
  plus: { paths: ['M12 5v14', 'M5 12h14'] },
  edit: { paths: ['M4 20l1-4.5L16.5 4a2.1 2.1 0 0 1 3 3L8 18.5z', 'M14 6.5l3.5 3.5'] },
  pin: { paths: ['M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z', circle(12, 10, 2.5)] },
  map: { paths: ['M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z', 'M9 4v13.5', 'M15 6.5V20'] },
  camera: {
    paths: ['M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', circle(12, 13, 3.5)]
  },
  notebook: {
    paths: ['M7 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M9 3v18', 'M12.5 8H16', 'M12.5 12H16']
  },
  plane: { paths: ['M21 3l-6.5 18-4-8-8-4z', 'M21 3 10.5 13.5'] },
  check: { paths: ['M5 12.5l4.5 4.5L19 7.5'] },
  close: { paths: ['M6 6l12 12', 'M18 6L6 18'] },
  'chevron-right': { paths: ['M9 5l7 7-7 7'] },
  'chevron-down': { paths: ['M6 9l6 6 6-6'] },
  'arrow-right': { paths: ['M4 12h16', 'M14 6l6 6-6 6'] },

  // —— 记账分类 ——
  food: { paths: ['M6 3v5a3 3 0 0 0 6 0V3', 'M9 11v10', 'M18 21V3c-2.2 1.2-3.5 3.7-3.5 6.5 0 1.8 1 3 3.5 3'] },
  transport: {
    paths: ['M5 11l1.6-4.2A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.3L19 11', 'M4 11h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z', 'M7.5 14.5h.01', 'M16.5 14.5h.01', 'M6.5 17v2.5', 'M17.5 17v2.5']
  },
  hotel: { paths: ['M3 5v14', 'M3 15h18v4', circle(7.5, 11, 1.8), 'M11 11h7a3 3 0 0 1 3 3v1'] },
  entertainment: {
    paths: ['M7 8h10a4 4 0 0 1 4 4.2l-.6 3.5a2.5 2.5 0 0 1-4.4 1.2L14.5 15h-5L8 16.9a2.5 2.5 0 0 1-4.4-1.2L3 12.2A4 4 0 0 1 7 8z', 'M8 10.5v3', 'M6.5 12h3', 'M15.5 11.2h.01', 'M17.5 13h.01']
  },
  ticket: {
    paths: ['M5 6h14a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1z', 'M14 8v1.5', 'M14 11.25v1.5', 'M14 14.5V16']
  },
  shopping: { paths: ['M5 8h14l-1 12H6z', 'M9 8V7a3 3 0 0 1 6 0v1'] },
  other: { paths: ['M4 8l8-4 8 4v8l-8 4-8-4z', 'M4 8l8 4 8-4', 'M12 12v8'] }
};
