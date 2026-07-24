# AGENTS.md

好用旅记：微信小程序（多人旅行记账）。

## 全局缓存规范（utils/cache.js）

会话级内存缓存（Map，小程序重启即失效，**不落地 storage**）。所有数据页必须遵循
stale-while-revalidate 模式：**进页先同步读缓存渲染（零白屏），后台请求成功后写缓存并更新页面**。

### 页面接入模式（统一三段式）

```js
loadData() {
  const key = cache.keys.xxx(id);
  const cached = cache.get(key);
  if (cached !== undefined) {
    this.applyData(cached);            // 1. 有缓存立即渲染，无 loading 态
  } else {
    this.setData({ loading: true });   //    仅无缓存时显示加载态
  }
  cache.fetchAndCache(key, () => api.getXxx(id)).then(data => {
    this.applyData(data);              // 2. 后台刷新：写缓存 + 更新页面（完全无感）
  }).catch(err => {
    this.setData({ loading: false });  // 3. 失败处理
    wx.showToast({
      title: cached !== undefined ? '数据更新失败，当前为缓存数据' : (err.message || '加载失败'),
      icon: 'none'
    });
  });
}
```

- 原 `.then` 里的数据处理/setData 逻辑原样提取为 `applyData()`，缓存渲染与后台更新复用同一方法。
- 多接口页面（如账单页 book + bills）需**全部命中缓存**才走缓存渲染，否则显示 loading。
- 后台刷新失败：有缓存 → 保留缓存数据 + toast「数据更新失败，当前为缓存数据」；无缓存 → 原有失败逻辑。
- 后台刷新**不加任何加载提示**（不用 wx.showNavigationBarLoading 等），保持完全无感。
- 原有静默失败的次要请求（如会员状态、emoji 列表）保持静默，仅读缓存 + 后台更新，不加 toast。

### 缓存 key 规范

统一由 `cache.keys` 生成，禁止在页面里手写 key 字符串：

| key | 内容 |
|---|---|
| `books` | 账本列表 |
| `book:{id}` | 账本详情（含成员） |
| `book:{id}:bills` | 账单分组 |
| `book:{id}:schedules` | 行程分组 |
| `book:{id}:statistics` | 统计数据 |
| `book:{id}:settlements:{mode}` | 结算方案（按模式分 key） |
| `user:profile` | 用户资料 |
| `system:emojis` | 「其他」分类 emoji |

账本相关 key 均以 `book:{id}` 开头，`removeByPrefix(cache.keys.book(id))` 可清掉该账本全部缓存
（已做边界处理，`book:1` 不会误删 `book:12`）。

### 并发去重

同一 key 的请求必须通过 `cache.fetchAndCache(key, fetcher)` 发起：进行中请求自动复用，
避免 onLoad + onShow 等场景重复请求；成功后自动写缓存。不要直接 `api.getXxx().then(...)` 后再
手动 `cache.set`。

### 缓存失效（集中在 utils/api.js 的写操作中，页面/组件无需关心）

- 新增写接口时**必须**在 api.js 对应方法里处理缓存失效：
  - 响应不是完整资源（如账单/行程增删改返回单条）→ `cache.remove` 相关 key；
  - 响应即最新完整资源（如 updateBook / updateBookAliases / updateUserProfile）→ `cache.set` 直接更新。
- 现有规则：
  - 账单增删改 → 清 `bills` / `statistics` / `settlements:*`（`invalidateBillRelated`）
  - 行程增删改 → 清 `schedules`
  - 账本/成员变动 → 清 `books` + `book:{id}`（`invalidateBookRelated`）；删账本用 `removeByPrefix` 清全部
  - 登录成功 → `cache.clear()`（防止 401 重登/换账号串数据）

### 注意事项

- `cache.set` 会忽略 `null` / `undefined`，缓存判断一律用 `cache.get(key) !== undefined`（空数组/空对象是有效缓存）。
- 新增数据页（含新增缓存 key 类型）时，同步更新本文件的 key 表与失效规则。
