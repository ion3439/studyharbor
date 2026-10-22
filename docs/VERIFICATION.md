# 版本验证记录

记录日期：2026-10-22。

## 已验证

- `dist/app.js`、`dist/core.js` 和 `scripts/serve.mjs` 的 JavaScript 语法检查通过。
- 14 项核心行为检查通过：链接校验与去重、表单数据验证、标签处理、JSON 恢复、无效备份整份拒绝、导入合并、编号冲突、搜索和排序。
- 运筹学示例入口已查阅 MIT OpenCourseWare 与 Google OR-Tools 官方页面。
- 本地网页已在浏览器成功打开；桌面及窄屏布局已检查，窄屏页面未出现整体横向溢出。
- 浏览器实际验证通过：新增资料、组合关键词搜索、学习状态修改、编辑笔记与本地位置、刷新后保留记录。
- JSON 备份下载成功；重复导入显示跳过 7 条同链接记录，已有记录保留。
- 重复收藏带不同片段的同一链接时，页面提示编辑已有资料。
- GitHub Actions 的语法与核心测试检查已成功运行，可在仓库 Actions 页面查看实际运行记录。
- GitHub Pages 设置页已显示站点上线，正式地址为 https://ion3439.github.io/studyharbor/ 。
- 正式应用页面 https://ion3439.github.io/studyharbor/dist/ 的一次网络检查返回 HTTP 200，标题为“学藏 StudyHarbor · 我的学习资料库”。
- 用户已在独立浏览器中打开正式网址，并确认能正常看到学藏页面。

## 待完成的验证

- 在线站点的浏览器交互验证：当前验证环境中的内置浏览器连接 `github.io` 被中断，因此不能把本地浏览器检查表述为在线浏览器检查。
- 线上全部静态文件与本地文件的逐一校验：当前网络连接不稳定，尚未完成。
- 在全新设备中实际验证完整的备份迁移；目前完整恢复由核心测试覆盖，浏览器中已验证同库合并去重。

语法检查与核心测试不能替代浏览器交互检查。在线地址和发布状态以仓库中的实际部署结果为准。

检查命令：

```sh
node --check dist/app.js
node --check dist/core.js
node --check scripts/serve.mjs
node --test tests/core.test.mjs
```
