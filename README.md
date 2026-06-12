# 好用旅记

多人旅行记账微信小程序，基于 [TDesign MiniProgram](https://tdesign.tencent.com/miniprogram) 组件库 + Skyline 渲染引擎开发。

## 功能

- 多人协作记账（创建/管理旅行账本、添加/删除成员）
- 旅行账单管理（收入/支出、分类统计、环形图表）
- 行程管理与分账结算
- 个人中心与意见反馈

## 开始

1. 克隆项目并安装依赖：
   ```bash
   git clone git@github.com:chaofanx/UsefulTravelogue.git
   npm install
   ```

2. 配置环境：
   ```bash
   cp utils/env.example.js utils/env.js
   ```
   编辑 `utils/env.js` 填入后端 API 地址。

3. 配置项目：
   ```bash
   cp project.config.tpl.json project.config.json
   ```
   编辑 `project.config.json` 填入你的微信小程序 appid。

4. 构建 npm：
   - 在微信开发者工具中点击 **工具 -> 构建 npm**

5. 在微信开发者工具中打开项目，选择 Skyline 渲染模式运行。

## 技术栈

- 微信小程序 + Skyline 渲染引擎
- [TDesign MiniProgram](https://tdesign.tencent.com/miniprogram) 组件库
- ECharts (ec-canvas)

## License

MIT
