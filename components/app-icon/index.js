const icons = require('./icons');

function toBase64(str) {
  // SVG 文本只含 ASCII，逐字符转字节即可
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i);
  return wx.arrayBufferToBase64(buf.buffer);
}

function buildSvg(name, color, active) {
  const def = icons[name];
  if (!def) return '';
  const body = def.paths.map((d, i) => {
    const filled = active && def.fill.indexOf(i) !== -1;
    return `<path d="${d}"${filled ? ` fill="${color}" fill-opacity="0.18"` : ''}/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

Component({
  properties: {
    name: { type: String, value: '' },
    size: { type: Number, value: 44 },
    color: { type: String, value: '#8b8b8b' },
    active: { type: Boolean, value: false }
  },

  data: { src: '' },

  observers: {
    'name, color, active'(name, color, active) {
      const svg = buildSvg(name, color, active);
      this.setData({ src: svg ? 'data:image/svg+xml;base64,' + toBase64(svg) : '' });
    }
  }
});
