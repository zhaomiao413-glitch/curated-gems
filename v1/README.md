# 第 1 节｜数据变网页：渲染卡片列表

## 课前准备
1. Fork 老师的仓库
2. 本地运行（任选其一）：
   - **推荐**：部署 GitHub Pages（Settings → Pages → Branch: main /root）
   - 本地预览：
     ```bash
     python3 -m http.server 8000
     # 打开 http://localhost:8000?v=1
     ```

## 课堂目标
- **技术**：用 JavaScript 把 JSON 数据渲染成网页卡片
- **信息策展**：学会给内容写摘要、打标签
- **AI 融入**：
  - 让 AI 根据原文链接生成 40 字摘要
  - 让 AI 提出标签词表和释义

## 操作步骤
1. 展示最终成品站（v4）
2. 启动本地预览，看到空白卡片区
3. 讲解项目结构：`index.html` / `style.css` / `data.json` / `v1/app.js`
4. 用 `fetch` 读取 `data.json` → `map()` 拼接 HTML → `innerHTML` 渲染
5. 修改 `data.json`：更新摘要、添加标签
6. 刷新页面，看到卡片内容变化
7. 简单修改样式（颜色、字体、圆角）

## 拓展挑战
- 用 AI 批量生成 `data.json` 的摘要和标签
- 添加更多条目（至少 10 条）
