# AGENTS.md

好用旅记：微信小程序（多人旅行记账）。

## 全局缓存规范（utils/cache.js）

会话级内存缓存（Map，小程序重启即失效，**不落地 storage**）。所有数据页必须遵循
stale-while-revalidate 模式：**进页先同步读缓存渲染（零白屏），后台请求成功后写缓存并更新页面**。

### 页面接入模式（统一三段式）

三段式已封装为 `cache.load(page, sources, apply)`，页面不要再手写：

```js
loadData() {
  const id = this.data.bookId;
  cache.load(this, [
    { key: cache.keys.book(id), fetch: () => api.getBook(id) },
    { key: cache.keys.bills(id), fetch: () => api.getBills(id) }
  ], (book, bills) => this.applyData(book, bills));   // apply 参数顺序与 sources 一致
}
```

`load` 内部行为：
1. **所有** sources 都命中缓存才同步 `apply(...缓存)`（无 loading 态）；否则 `setData({ loading: true })`。
2. 并发请求（同 key 自动去重），成功后写缓存并 `apply(...最新数据)`。
3. 失败：`setData({ loading: false })` + toast；有缓存提示「数据更新失败，当前为缓存数据」，无缓存提示错误信息。

- 数据处理/setData 逻辑放在 `applyData()`，缓存渲染与后台更新复用同一方法。
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
| `system:categories` | 记账分类列表（后端为准，页面内保留兜底默认值） |

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

## 账本页面公共工具（utils/bookPage.js）

账本子页面（bill / schedule / statistics / ticket / memberList / bookDetail）统一使用：
`parseBookId`（参数校验+回退）、`switchBookTab`（底部 tab 跳转）、`inviteShare`（邀请分享内容）。
新增账本子页面时直接复用，不要再复制 `onLoad` 校验、`routes` 映射和分享文案；日期格式化用 `util.dateToStr`。

## 样式

底部表单弹层的公共样式（`.popup-handle` / `.handle-bar` / `.popup-title` / `.form-item` / `.form-label` / `.popup-footer`）在 `app.wxss`，页面只写与默认值不同的覆盖项。

## 接口文档

不再维护手写的 API.md，接口以后端 `/docs`（FastAPI 自动生成的 OpenAPI）为准。
