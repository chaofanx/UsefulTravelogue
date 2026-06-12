const { BASE_URL } = require('./env');

function getToken() {
  try {
    return wx.getStorageSync('token') || '';
  } catch (e) {
    return '';
  }
}

function setToken(token) {
  try {
    wx.setStorageSync('token', token);
  } catch (e) {}
}

function clearToken() {
  try {
    wx.removeStorageSync('token');
  } catch (e) {}
}

// ===== 字段命名转换（边界统一）=====
// 后端统一 snake_case，前端统一 camelCase。
// 出参（响应）一律转 camelCase，入参（请求体/查询）一律转回 snake_case。
// member_aliases / memberAliases 的 value 是以「成员名」为 key 的映射，
// 其内部 key 不能被转换，故整体保留 value 不递归。
const PRESERVE_VALUE_KEYS = { member_aliases: true, memberAliases: true };

function snakeToCamel(str) {
  return str.replace(/_([a-zA-Z0-9])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
}

function deepConvert(value, keyFn) {
  if (Array.isArray(value)) {
    return value.map(v => deepConvert(v, keyFn));
  }
  if (value && typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach(k => {
      const nk = keyFn(k);
      out[nk] = PRESERVE_VALUE_KEYS[k] ? value[k] : deepConvert(value[k], keyFn);
    });
    return out;
  }
  return value;
}

function toCamel(value) {
  return deepConvert(value, snakeToCamel);
}

function toSnake(value) {
  return deepConvert(value, camelToSnake);
}

function request(method, path, data) {
  const token = getToken();
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + path,
      method: method,
      data: data ? toSnake(data) : data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success(res) {
        if (res.statusCode === 200) {
          const body = res.data;
          if (body && body.code === 0) {
            resolve(toCamel(body.data));
          } else if (res.statusCode === 401) {
            clearToken();
            reject({ code: 401, message: '未登录或登录已过期' });
          } else {
            reject({ code: body ? body.code : -1, message: (body && body.message) || '请求失败' });
          }
        } else if (res.statusCode === 401) {
          clearToken();
          reject({ code: 401, message: '未登录或登录已过期' });
        } else {
          reject({ code: res.statusCode, message: '请求失败' });
        }
      },
      fail(err) {
        reject({ code: -1, message: err.errMsg || '网络错误' });
      }
    });
  });
}

function get(path, data) {
  return request('GET', path, data);
}

function post(path, data) {
  return request('POST', path, data);
}

function put(path, data) {
  return request('PUT', path, data);
}

function del(path) {
  return request('DELETE', path);
}

// 响应已是 camelCase。成员对象补一个语义别名 name（= nickname），
// 供模板统一以 member.name 使用。
function normalizeMember(m) {
  if (!m) return m;
  return {
    ...m,
    id: m.id || m.userId,
    userId: m.userId || null,
    name: m.nickname || m.name || '',
    avatar: m.avatar || '',
    avatarColor: m.avatarColor || ''
  };
}

function normalizeMembers(members) {
  if (!members || !Array.isArray(members)) return [];
  return members.map(normalizeMember);
}

function normalizeBook(book) {
  if (!book) return book;
  return {
    ...book,
    coverColor: book.coverColor || '#4A90D9',
    members: normalizeMembers(book.members)
  };
}

function normalizeBooks(books) {
  if (!books || !Array.isArray(books)) return [];
  return books.map(normalizeBook);
}

const api = {
  BASE_URL,

  login(code, nickname, avatar) {
    const payload = { code };
    if (nickname) payload.nickname = nickname;
    if (avatar) payload.avatar = avatar;
    return post('/user/login', payload).then(data => {
      if (data && data.token) {
        setToken(data.token);
      }
      return data;
    });
  },

  getUserProfile() {
    return get('/user/profile');
  },

  updateUserProfile(data) {
    return put('/user/profile', data);
  },


  getBooks() {
    return get('/books').then(data => {
      if (data && data.books) return normalizeBooks(data.books);
      if (Array.isArray(data)) return normalizeBooks(data);
      return data;
    });
  },

  createBook(book) {
    return post('/books', {
      title: book.title,
      cover: book.cover,
      coverColor: book.coverColor,
      date: book.date
    }).then(data => normalizeBook(data));
  },

  getBook(bookId) {
    return get(`/books/${bookId}`).then(data => normalizeBook(data));
  },

  updateBook(bookId, updates) {
    return put(`/books/${bookId}`, {
      title: updates.title,
      cover: updates.cover,
      coverColor: updates.coverColor
    }).then(data => normalizeBook(data));
  },

  deleteBook(bookId) {
    return del(`/books/${bookId}`);
  },

  getBills(bookId, params) {
    return get(`/books/${bookId}/bills`, params);
  },

  createBill(bookId, bill) {
    return post(`/books/${bookId}/bills`, bill);
  },

  updateBill(bookId, billId, bill) {
    return put(`/books/${bookId}/bills/${billId}`, bill);
  },

  deleteBill(bookId, billId) {
    return del(`/books/${bookId}/bills/${billId}`);
  },

  getSchedules(bookId) {
    return get(`/books/${bookId}/schedules`);
  },

  createSchedule(bookId, schedule) {
    return post(`/books/${bookId}/schedules`, schedule);
  },

  updateSchedule(bookId, scheduleId, schedule) {
    return put(`/books/${bookId}/schedules/${scheduleId}`, schedule);
  },


  addMember(bookId, member) {
    return post(`/books/${bookId}/members`, member).then(data => normalizeMember(data));
  },

  joinBook(bookId) {
    return post(`/books/${bookId}/join`);
  },

  removeMember(bookId, memberId) {
    return del(`/books/${bookId}/members/${memberId}`);
  },

  updateBookAliases(bookId, memberAliases) {
    return put(`/books/${bookId}/aliases`, { memberAliases: memberAliases }).then(data => normalizeBook(data));
  },

  getStatistics(bookId) {
    return get(`/books/${bookId}/statistics`);
  },

  getSettlements(bookId, mode) {
    return get(`/books/${bookId}/settlements`, { mode: mode || 'smart' });
  },

  getTeamSettlements(bookId) {
    return get(`/books/${bookId}/settlements/team`);
  },

  submitFeedback(data) {
    return post('/feedback', data);
  }
};

module.exports = api;
