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

function request(method, path, data) {
  const token = getToken();
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + path,
      method: method,
      data: data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success(res) {
        if (res.statusCode === 200) {
          const body = res.data;
          if (body && body.code === 0) {
            resolve(body.data);
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

function normalizeMember(m) {
  return {
    id: m.id || m.userId,
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
    return post('/user/login', { code, nickname, avatar }).then(data => {
      if (data && data.token) {
        setToken(data.token);
      }
      return data;
    });
  },

  getUserProfile() {
    return get('/user/profile');
  },

  updateUserProfile(profile) {
    return put('/user/profile', profile);
  },

  getBooks() {
    return get('/books').then(data => {
      if (Array.isArray(data)) return normalizeBooks(data);
      return data;
    });
  },

  createBook(book) {
    return post('/books', book).then(data => normalizeBook(data));
  },

  getBook(bookId) {
    return get(`/books/${bookId}`).then(data => normalizeBook(data));
  },

  updateBook(bookId, updates) {
    return put(`/books/${bookId}`, updates).then(data => normalizeBook(data));
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

  deleteSchedule(bookId, scheduleId) {
    return del(`/books/${bookId}/schedules/${scheduleId}`);
  },

  addMember(bookId, member) {
    return post(`/books/${bookId}/members`, member).then(data => normalizeMember(data));
  },

  removeMember(bookId, memberId) {
    return del(`/books/${bookId}/members/${memberId}`);
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
