# 好用旅记 — 后端接口文档

> 版本：v1.0.0  
> 基础路径：`{BASE_URL}`（开发环境示例：`https://api.example.com/v1`）
> 鉴权方式：微信登录返回的 `Bearer Token`，所有接口需在 Header 中携带 `Authorization: Bearer <token>`

---

## 目录

1. [全局规范](#全局规范)
2. [用户模块](#用户模块)
3. [账本模块](#账本模块)
4. [账单模块](#账单模块)
5. [行程模块](#行程模块)
6. [成员模块](#成员模块)
7. [统计模块](#统计模块)
8. [分账模块](#分账模块)
9. [导出模块](#导出模块)

---

## 全局规范

### 通用响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

| code | 说明 |
|------|------|
| 0 | 成功 |
| 401 | 未登录/token过期 |
| 403 | 无权限（非账本成员） |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

### 调用时机说明

各接口的调用时机已在章节开头标注，使用以下标记：

- 🔵 **页面加载** — `onLoad` 生命周期调用
- 🟢 **页面显示** — `onShow` 生命周期调用（每次切回页面）
- 🟡 **用户操作** — 用户点击按钮/提交表单时调用
- 🔴 **后台任务** — 非用户直接触发的调用

---

## 用户模块

### 1. 微信登录

> 🔵 调用时机：小程序启动时 `app.js` `onLaunch`，获取 token 后缓存

```
POST /user/login
```

**请求体：**

```json
{
  "code": "0a3xZqFa1qXQ0K0p6YGa1E3sDc2xZqFW",
  "nickname": "张本友",
  "avatar": "https://wx.qlogo.cn/mmopen/xxx"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | `wx.login()` 返回的临时凭证 |
| nickname | string | 否 | 用户昵称 |
| avatar | string | 否 | 用户头像URL |

**响应：**

```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1001,
      "nickname": "张本友",
      "avatar": "https://wx.qlogo.cn/mmopen/xxx",
      "phone": "",
      "createdAt": "2025-06-01T10:00:00Z"
    }
  }
}
```

---

### 2. 获取用户信息

> � A 调用时机：`pages/profile/index` 页面加载时

```
GET /user/profile
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": 1001,
    "nickname": "张本友",
    "avatar": "https://wx.qlogo.cn/mmopen/xxx",
    "phone": "138****8888",
    "bookCount": 6,
    "vip": false,
    "createdAt": "2025-06-01T10:00:00Z"
  }
}
```

---

### 3. 更新用户信息

> 🟡 调用时机：用户在个人中心修改昵称/头像时

```
PUT /user/profile
```

**请求体：**

```json
{
  "nickname": "张本友2",
  "avatar": "https://wx.qlogo.cn/mmopen/yyy"
}
```

**响应：** 同获取用户信息

---

## 账本模块

### 4. 获取账本列表

> 🔵 调用时机：`pages/index/index` `onLoad`  
> 🟢 调用时机：`pages/index/index` `onShow`（新建账本返回后刷新）

```
GET /books
```

**响应：**

```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "title": "五一北京",
      "cover": "",
      "coverColor": "#4A90D9",
      "date": "2025年5月",
      "vip": true,
      "memberCount": 4,
      "members": [
        {
          "id": 1001,
          "nickname": "张本友",
          "avatar": "",
          "avatarColor": "#38C172"
        },
        {
          "id": 1002,
          "nickname": "陈晓",
          "avatar": "",
          "avatarColor": "#FF6B6B"
        }
      ],
      "createdAt": "2025-04-28T08:00:00Z",
      "updatedAt": "2025-05-05T22:00:00Z"
    }
  ],
  "total": 6
}
```

---

### 5. 创建账本

> 🟡 调用时机：首页新建账本半浮层 — 点击「完成」按钮

```
POST /books
```

**请求体：**

```json
{
  "title": "五一北京",
  "cover": "wxfile://tmp_xxx.jpg",
  "coverColor": "#4A90D9",
  "date": "2025年5月"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 账本名称，最长8字 |
| cover | string | 否 | 封面临时路径，后端上传至云存储 |
| coverColor | string | 否 | 封面底色，未传cover时生效 |
| date | string | 否 | 出行月份，默认当月 |

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": 7,
    "title": "五一北京",
    "cover": "https://cdn.example.com/covers/7.jpg",
    "coverColor": "#4A90D9",
    "date": "2025年5月",
    "vip": false,
    "members": [
      {
        "id": 1001,
        "nickname": "张本友",
        "avatar": "",
        "avatarColor": "#38C172"
      }
    ],
    "createdAt": "2025-06-05T12:00:00Z"
  }
}
```

**注意：** 创建账本时自动将创建者设为第一个成员。

---

### 6. 获取账本详情

> 🔵 调用时机：`pages/book/bill/index`、`pages/book/schedule/index`、`pages/book/statistics/index` 初次加载  
> 🟢 调用时机：账本设置变更后（封面/名称/成员变化）

```
GET /books/:bookId
```

**响应：** 同创建账本返回格式，另含 `memberCount`

---

### 7. 更新账本

> 🟡 调用时机：账本设置半浮层 — 更换名称/封面确认时

```
PUT /books/:bookId
```

**请求体（更换名称）：**

```json
{
  "title": "京津五日游"
}
```

**请求体（更换封面）：**

```json
{
  "cover": "wxfile://tmp_new_cover.jpg"
}
```

**请求体（更换底色）：**

```json
{
  "coverColor": "#FF6B6B"
}
```

**响应：** 同获取账本详情

---

### 8. 解散账本

> 🟡 调用时机：账本设置 — 点击「解散账本」→ 确认弹窗 → 确认

```
DELETE /books/:bookId
```

**响应：**

```json
{
  "code": 0,
  "message": "账本已解散"
}
```

**业务逻辑：** 级联删除该账本下所有账单、行程、分账数据。

---

## 账单模块

### 9. 获取账单列表

> 🔵 调用时机：`pages/book/bill/index` `onLoad`  
> 🟢 调用时机：`pages/book/bill/index` `onShow`（添加/编辑账单返回后刷新）

```
GET /books/:bookId/bills
```

**请求参数（可选）：**

| 参数 | 类型 | 说明 |
|------|------|------|
| date | string | 按日期筛选，格式 `2025-05-04` |
| category | string | 按分类筛选，如 `餐饮` |
| page | number | 页码，默认1 |
| size | number | 每页条数，默认50 |

**响应：**

```json
{
  "code": 0,
  "data": {
    "groups": [
      {
        "date": "2025-05-04",
        "dayOfWeek": "星期天",
        "bills": [
          {
            "id": 1,
            "category": "餐饮",
            "icon": "food",
            "amount": 48.00,
            "payer": "张本友",
            "time": "15:03",
            "remark": "王府井小吃街",
            "createdAt": "2025-05-04T07:03:00Z"
          },
          {
            "id": 2,
            "category": "交通",
            "icon": "transport",
            "amount": 126.25,
            "payer": "陈晓",
            "time": "09:30",
            "remark": "打车去机场",
            "createdAt": "2025-05-04T01:30:00Z"
          }
        ],
        "totalOut": 174.25,
        "totalIn": 0
      },
      {
        "date": "2025-05-03",
        "dayOfWeek": "星期六",
        "bills": [
          {
            "id": 3,
            "category": "餐饮",
            "icon": "food",
            "amount": 86.00,
            "payer": "王芳",
            "time": "12:30",
            "remark": "午餐",
            "createdAt": "2025-05-03T04:30:00Z"
          }
        ],
        "totalOut": 86.00,
        "totalIn": 0
      }
    ],
    "totalAmount": 174.25
  }
}
```

**注意：** 后端按日期分组、按日期降序排列，前端直接渲染。

---

### 10. 添加账单

> 🟡 调用时机：`pages/addBill/index` — 点击「记一笔」按钮

```
POST /books/:bookId/bills
```

**请求体：**

```json
{
  "category": "餐饮",
  "amount": 48.00,
  "payer": "张本友",
  "remark": "王府井小吃街",
  "date": "2025-06-05",
  "time": "15:03"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 是 | 分类：餐饮/交通/住宿/娱乐/门票/购物/其他 |
| amount | number | 是 | 金额，正数 |
| payer | string | 是 | 付款人名称 |
| remark | string | 否 | 备注 |
| date | string | 否 | 日期，默认当天 |
| time | string | 否 | 时间，默认当前时分 |

**业务逻辑：**
- 后端根据 `category` 自动填充 `icon` 字段
- 金额保留两位小数

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": 14,
    "category": "餐饮",
    "icon": "food",
    "amount": 48.00,
    "payer": "张本友",
    "time": "15:03",
    "date": "2025-06-05",
    "remark": "王府井小吃街",
    "createdAt": "2025-06-05T07:03:00Z"
  }
}
```

---

### 11. 更新账单

> 🟡 调用时机：`pages/addBill/index`（编辑模式）— 点击「保存修改」

```
PUT /books/:bookId/bills/:billId
```

**请求体：** 同添加账单，所有字段可选（只传变更字段）

```json
{
  "amount": 52.00,
  "remark": "更正金额"
}
```

**响应：** 同添加账单

---

### 12. 删除账单

> 🟡 调用时机：`pages/addBill/index`（编辑模式）— 点击「删除此账单」→ 确认弹窗

```
DELETE /books/:bookId/bills/:billId
```

**响应：**

```json
{
  "code": 0,
  "message": "账单已删除"
}
```

---

## 行程模块

### 13. 获取行程列表

> 🔵 调用时机：`pages/book/schedule/index` `onLoad`  
> 🟢 调用时机：添加/编辑行程后 `loadData()` 刷新

```
GET /books/:bookId/schedules
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "groups": [
      {
        "date": "2025-05-03",
        "dayOfWeek": "星期六",
        "schedules": [
          {
            "id": 2,
            "location": "故宫博物院",
            "address": "北京市东城区",
            "latitude": 39.9163,
            "longitude": 116.3972,
            "period": "上午",
            "notes": "需要提前预约，珍宝馆值得一看。",
            "date": "2025-05-03",
            "dayOfWeek": "星期六",
            "contributor": "陈晓",
            "createdAt": "2025-05-03T00:00:00Z"
          }
        ]
      }
    ],
    "total": 8
  }
}
```

---

### 14. 添加行程

> 🟡 调用时机：行程页 — 半浮层「添加行程」点击确定

```
POST /books/:bookId/schedules
```

**请求体：**

```json
{
  "location": "故宫博物院",
  "address": "北京市东城区",
  "latitude": 39.9163,
  "longitude": 116.3972,
  "period": "上午",
  "notes": "需要提前预约，珍宝馆值得一看。",
  "date": "2025-05-03"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| location | string | 是 | 目的地名称 |
| address | string | 否 | 详细地址 |
| latitude | number | 否 | 纬度（来自 `wx.chooseLocation`） |
| longitude | number | 否 | 经度（来自 `wx.chooseLocation`） |
| period | string | 否 | 时段：全天/上午/下午/晚上 |
| notes | string | 否 | 备注，最长300字 |
| date | string | 否 | 日期，默认当天 |

**业务逻辑：** `dayOfWeek` 由后端根据 `date` 自动计算。

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": 9,
    "location": "故宫博物院",
    "address": "北京市东城区",
    "latitude": 39.9163,
    "longitude": 116.3972,
    "period": "上午",
    "notes": "需要提前预约，珍宝馆值得一看。",
    "date": "2025-05-03",
    "dayOfWeek": "星期六",
    "contributor": "张本友",
    "createdAt": "2025-06-05T12:00:00Z"
  }
}
```

**注意：** `contributor` 自动取当前登录用户的昵称。

---

### 15. 更新行程

> 🟡 调用时机：行程编辑半浮层 — 点击「保存」

```
PUT /books/:bookId/schedules/:scheduleId
```

**请求体：** 同添加行程，字段可选

```json
{
  "period": "全天",
  "notes": "补充：记得带身份证"
}
```

**响应：** 同添加行程

---

### 16. 删除行程

> 🟡 调用时机：预留（当前前端未暴露删除入口，可在编辑浮层扩展）

```
DELETE /books/:bookId/schedules/:scheduleId
```

**响应：**

```json
{
  "code": 0,
  "message": "行程已删除"
}
```

---

## 成员模块

### 17. 添加成员

> 🟡 调用时机：账本设置 — 增加成员

```
POST /books/:bookId/members
```

**请求体：**

```json
{
  "userId": 1002,
  "nickname": "陈晓"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | number | 否 | 已注册用户的ID，优先使用 |
| nickname | string | 是 | 成员名称 |

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": 1002,
    "nickname": "陈晓",
    "avatar": "https://wx.qlogo.cn/mmopen/xxx",
    "avatarColor": "#FF6B6B"
  }
}
```

---

### 18. 移除成员

> 🟡 调用时机：账本设置 — 增加成员浮层 — 点击成员标签 × → 确认弹窗

```
DELETE /books/:bookId/members/:memberId
```

**业务逻辑：** 不可移除创建者（第一个成员）

**响应：**

```json
{
  "code": 0,
  "message": "成员已移除"
}
```

---

## 统计模块

### 19. 获取支出统计

> 🔵 调用时机：`pages/book/statistics/index` `onLoad`

```
GET /books/:bookId/statistics
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "totalAmount": 1795.40,
    "categories": [
      {
        "name": "住宿",
        "icon": "hotel",
        "iconColor": "#4A90D9",
        "value": 1001.72,
        "percent": 55.8,
        "count": 2
      },
      {
        "name": "餐饮",
        "icon": "food",
        "iconColor": "#FF6B6B",
        "value": 622.43,
        "percent": 34.7,
        "count": 5
      },
      {
        "name": "交通",
        "icon": "transport",
        "iconColor": "#38C172",
        "value": 126.25,
        "percent": 7.0,
        "count": 3
      },
      {
        "name": "门票",
        "icon": "ticket",
        "iconColor": "#6C5CE7",
        "value": 25.00,
        "percent": 1.4,
        "count": 1
      },
      {
        "name": "娱乐",
        "icon": "entertainment",
        "iconColor": "#FFD93D",
        "value": 20.00,
        "percent": 1.1,
        "count": 1
      }
    ],
    "memberStats": [
      {
        "memberId": 1001,
        "nickname": "张本友",
        "paid": 876.43,
        "shouldPay": 448.85
      },
      {
        "memberId": 1002,
        "nickname": "陈晓",
        "paid": 351.25,
        "shouldPay": 448.85
      }
    ]
  }
}
```

---

## 分账模块

### 20. 获取分账方案

> 🔵 调用时机：`pages/book/statistics/index` `onLoad` — 与统计接口并行请求

```
GET /books/:bookId/settlements?mode=smart
```

| 参数 | 类型 | 说明 |
|------|------|------|
| mode | string | `smart`（智能简化分账）/ `traditional`（传统逐人分账） |

**响应（智能简化分账）：**

```json
{
  "code": 0,
  "data": {
    "mode": "smart",
    "description": "自动合并转账链路，多人时最快分账",
    "settlements": [
      {
        "fromUser": {
          "id": 1003,
          "nickname": "李大为",
          "avatar": "",
          "avatarColor": "#FFD93D"
        },
        "toUser": {
          "id": 1002,
          "nickname": "陈晓",
          "avatar": "",
          "avatarColor": "#FF6B6B"
        },
        "amount": 2261.48,
        "description": "需转账给陈晓"
      },
      {
        "fromUser": {
          "id": 1004,
          "nickname": "王芳",
          "avatar": "",
          "avatarColor": "#6C5CE7"
        },
        "toUser": {
          "id": 1002,
          "nickname": "陈晓",
          "avatar": "",
          "avatarColor": "#FF6B6B"
        },
        "amount": 85.30,
        "description": "需转账给陈晓"
      }
    ]
  }
}
```

**说明：**
- `smart` 模式：自动合并循环债务，减少转账链路
- `traditional` 模式：每笔账单按人数均分，逐人列出转账关系

---

### 21. 获取团队总方案

```
GET /books/:bookId/settlements/team
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "transfers": [
      {
        "from": "李大为",
        "to": "陈晓",
        "amount": 2261.48
      },
      {
        "from": "王芳",
        "to": "陈晓",
        "amount": 85.30
      }
    ],
    "totalTransfers": 2,
    "totalAmount": 2346.78
  }
}
```

---

## 导出模块

### 22. 导出 Excel

> 🟡 调用时机：分账统计页 — 点击「导出为 Excel 表格」

```
GET /books/:bookId/export?format=excel
```

**响应：** 二进制文件流，Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**包含工作表：**
1. **账单明细** — 日期、分类、金额、付款人、备注
2. **分类汇总** — 分类、金额、占比
3. **分账方案** — 付款方、收款方、金额

---

## 数据传输说明

### 封面上传

创建/修改账本时，`cover` 字段传输的是 `wx.chooseMedia` 返回的临时文件路径。后端流程：

1. 接收 `cover` (wxfile:// 临时路径)
2. 上传至 OSS/CDN
3. 将持久化 URL 存入数据库
4. 返回 URL 给前端

### 分类与图标映射

| 分类名 | icon值 | 图标 |
|--------|--------|------|
| 餐饮 | food | 🍽️ |
| 交通 | transport | 🚗 |
| 住宿 | hotel | 🏨 |
| 娱乐 | entertainment | 🎮 |
| 门票 | ticket | 🎫 |
| 购物 | shopping | 🛍️ |
| 其他 | other | 📦 |

前后端使用相同的 `icon` 字符串，由前端 `travel-icons` 组件渲染为 emoji。

### 日期格式

所有日期字段统一使用 `YYYY-MM-DD` 格式，例如 `2025-05-04`。月份展示格式 `YYYY年M月` 由前端 `utils/util.js` 格式化。

---

## 数据库表设计建议

```sql
-- 用户表
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) UNIQUE NOT NULL,
  nickname VARCHAR(32),
  avatar VARCHAR(512),
  phone VARCHAR(20),
  vip TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 账本表
CREATE TABLE books (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  creator_id BIGINT NOT NULL,
  title VARCHAR(32) NOT NULL,
  cover VARCHAR(512),
  cover_color VARCHAR(16) DEFAULT '#4A90D9',
  date VARCHAR(32),
  vip TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- 账本成员表
CREATE TABLE book_members (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  book_id BIGINT NOT NULL,
  user_id BIGINT,
  nickname VARCHAR(32) NOT NULL,
  avatar VARCHAR(512),
  avatar_color VARCHAR(16),
  is_creator TINYINT DEFAULT 0,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- 账单表
CREATE TABLE bills (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  book_id BIGINT NOT NULL,
  category VARCHAR(16) NOT NULL,
  icon VARCHAR(32),
  amount DECIMAL(10,2) NOT NULL,
  payer VARCHAR(32) NOT NULL,
  payer_id BIGINT,
  time VARCHAR(8),
  date VARCHAR(16) NOT NULL,
  remark VARCHAR(200),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- 行程表
CREATE TABLE schedules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  book_id BIGINT NOT NULL,
  location VARCHAR(100) NOT NULL,
  address VARCHAR(200),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  period VARCHAR(8) DEFAULT '全天',
  notes VARCHAR(600),
  date VARCHAR(16) NOT NULL,
  day_of_week VARCHAR(8),
  contributor VARCHAR(32),
  contributor_id BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);
```
