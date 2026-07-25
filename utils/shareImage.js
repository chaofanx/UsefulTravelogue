// 生成分享封面图：以账本封面（无封面或加载失败时用封面底色）为底，
// 底部加渐变遮罩，左下角绘制白色账本名。
// 返回 Promise<string>（本地临时图片路径），供 onShareAppMessage 的 imageUrl 使用。
// 用法：generateShareImage(pageCtx, book).then(path => ...)

const WIDTH = 500; // 微信分享图推荐尺寸比例 5:4
const HEIGHT = 400;
const SCRIM_HEIGHT = 160; // 底部渐变遮罩高度
const PADDING = 24; // 文字留白
const FONT_SIZE = 30;
const FALLBACK_COLOR = '#4A90D9';

function getCanvasNode(pageCtx, canvasId) {
  return new Promise((resolve, reject) => {
    wx.createSelectorQuery()
      .in(pageCtx)
      .select(`#${canvasId}`)
      .fields({ node: true })
      .exec(res => {
        if (res && res[0] && res[0].node) {
          resolve(res[0].node);
        } else {
          reject(new Error('分享图画布未就绪'));
        }
      });
  });
}

// 网络封面图先下载为本地路径（要求域名在 downloadFile 白名单内）
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src: url,
      success: res => resolve(res.path),
      fail: reject
    });
  });
}

function loadImage(canvas, src) {
  return new Promise((resolve, reject) => {
    const img = canvas.createImage();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('封面图加载失败'));
    img.src = src;
  });
}

// aspectFill 居中裁剪铺满画布
function drawCover(ctx, img) {
  const scale = Math.max(WIDTH / img.width, HEIGHT / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (WIDTH - w) / 2, (HEIGHT - h) / 2, w, h);
}

// 底部渐变遮罩，保证任何封面上文字都可读
function drawScrim(ctx) {
  const gradient = ctx.createLinearGradient(0, HEIGHT - SCRIM_HEIGHT, 0, HEIGHT);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, HEIGHT - SCRIM_HEIGHT, WIDTH, SCRIM_HEIGHT);
}

// 超长文本按可用宽度截断并追加省略号
function ellipsize(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + '…').width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + '…';
}

function drawTitle(ctx, title) {
  ctx.font = `bold ${FONT_SIZE}px sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'bottom';
  ctx.fillText(ellipsize(ctx, title, WIDTH - PADDING * 2), PADDING, HEIGHT - PADDING);
}

function canvasToTempFilePath(canvas) {
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas,
      success: res => resolve(res.tempFilePath),
      fail: reject
    });
  });
}

/**
 * @param pageCtx  页面实例（用于 selectorQuery.in）
 * @param book     账本对象（title / cover / coverColor）
 * @param canvasId 隐藏画布 id，默认 shareCanvas
 */
function generateShareImage(pageCtx, book, canvasId = 'shareCanvas') {
  book = book || {};
  let canvas;
  let ctx;

  return getCanvasNode(pageCtx, canvasId).then(node => {
    canvas = node;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    ctx = canvas.getContext('2d');

    // 底：优先封面图，无封面或加载失败则用封面底色
    if (!book.cover) return false;
    const srcPromise = /^https?:/.test(book.cover)
      ? downloadImage(book.cover)
      : Promise.resolve(book.cover);
    return srcPromise
      .then(src => loadImage(canvas, src))
      .then(img => {
        drawCover(ctx, img);
        return true;
      })
      .catch(() => false);
  }).then(drawn => {
    if (!drawn) {
      ctx.fillStyle = book.coverColor || FALLBACK_COLOR;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    drawScrim(ctx);
    drawTitle(ctx, book.title || '');
    return canvasToTempFilePath(canvas);
  });
}

// ===== 小程序品牌推广分享图（首页「推荐给朋友」）=====
// 品牌绿渐变底 + 装饰圆 + ✈️ + 小程序名称与介绍，无需任何外部图片资源。

function drawDecorCircle(ctx, x, y, r, alpha) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.fill();
}

function drawAppBrand(ctx) {
  // 品牌绿 → 旅青 对角渐变
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#38C172');
  gradient.addColorStop(1, '#45B7D1');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 半透明装饰圆，增加层次感
  drawDecorCircle(ctx, 60, 60, 90, 0.10);
  drawDecorCircle(ctx, WIDTH - 40, 120, 60, 0.12);
  drawDecorCircle(ctx, WIDTH - 90, HEIGHT - 50, 110, 0.10);
  drawDecorCircle(ctx, 90, HEIGHT - 80, 50, 0.12);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';

  // 图标
  ctx.font = '64px sans-serif';
  ctx.fillText('✈️', WIDTH / 2, 118);

  // 小程序名称
  ctx.font = 'bold 46px sans-serif';
  ctx.fillText('好用旅记', WIDTH / 2, 196);

  // 一句话介绍
  ctx.font = '24px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fillText('简单好用的多人记账、自动分账工具', WIDTH / 2, 252);

  // 功能点
  ctx.font = '20px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('旅行记账 · 自动分账 · 行程规划', WIDTH / 2, 306);
}

/**
 * @param pageCtx  页面实例（用于 selectorQuery.in）
 * @param canvasId 隐藏画布 id，默认 shareCanvas
 */
function generateAppShareImage(pageCtx, canvasId = 'shareCanvas') {
  let canvas;
  return getCanvasNode(pageCtx, canvasId).then(node => {
    canvas = node;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');
    drawAppBrand(ctx);
    return canvasToTempFilePath(canvas);
  });
}

module.exports = { generateShareImage, generateAppShareImage };
