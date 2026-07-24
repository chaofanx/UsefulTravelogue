// 会话级全局缓存（仅内存，小程序重启即失效）。
// 用法（stale-while-revalidate）：页面进入时先 cache.get 同步渲染缓存，
// 再通过 cache.fetchAndCache 后台请求，成功后自动写缓存，页面用新数据更新。
// 写操作（增删改）在 api.js 中集中失效相关 key，页面无需关心。

const store = new Map();
const pending = new Map();

// 统一缓存 key。账本相关的 key 都以 `book:{id}` 开头，
// 便于 removeByPrefix 一次清掉某账本的全部缓存。
const keys = {
  books: () => 'books',
  book: (id) => `book:${id}`,
  bills: (id) => `book:${id}:bills`,
  schedules: (id) => `book:${id}:schedules`,
  statistics: (id) => `book:${id}:statistics`,
  settlements: (id, mode) => `book:${id}:settlements:${mode || 'smart'}`,
  profile: () => 'user:profile',
  emojis: () => 'system:emojis'
};

function get(key) {
  return store.has(key) ? store.get(key) : undefined;
}

function set(key, value) {
  if (value !== undefined && value !== null) {
    store.set(key, value);
  }
}

function remove(key) {
  store.delete(key);
}

// 按前缀清除。精确匹配 prefix 本身，或以 `prefix:` 开头的 key
// （避免 removeByPrefix('book:1') 误删 'book:12' 的缓存）。
function removeByPrefix(prefix) {
  const childPrefix = prefix + ':';
  Array.from(store.keys()).forEach(k => {
    if (k === prefix || k.indexOf(childPrefix) === 0) {
      store.delete(k);
    }
  });
}

function clear() {
  store.clear();
}

// 带并发去重的请求：同一 key 同时进行中的请求只发一次，成功后写入缓存。
function fetchAndCache(key, fetcher) {
  let p = pending.get(key);
  if (!p) {
    p = Promise.resolve()
      .then(fetcher)
      .then(data => {
        set(key, data);
        pending.delete(key);
        return data;
      })
      .catch(err => {
        pending.delete(key);
        throw err;
      });
    pending.set(key, p);
  }
  return p;
}

module.exports = { keys, get, set, remove, removeByPrefix, clear, fetchAndCache };
