# 发布到 GitHub

当前源码已准备好。公开仓库是否已发布，应以实际仓库链接为准；本说明不代表已完成发布。

## 用网页发布源码

1. 登录你自己的 GitHub 账号。
2. 创建一个新仓库，名称可用 `studyharbor`，简介可写“按主题收藏学习资料，记录学习进度的本地优先资料库”。
3. 选择 Public，让其他人能够查看与贡献代码。
4. 源码包里已有 README、MIT 许可证和 `.gitignore`，创建时不必重复生成这些文件。
5. 将源码包解压，通过 GitHub 的文件上传入口把项目文件上传到仓库根目录。让 `README.md` 和 `dist/` 直接位于根目录，不要再套一层文件夹。
6. 确认浏览器已选择上传 `.github/` 下的检查流程与问题模板。某些文件选择器会隐藏点开头目录；可以通过 Git 或 GitHub Desktop 补齐。
7. 检查 README 能显示、文件完整、自动检查通过。

只上传项目源码。自己的 JSON 收藏备份和真实学习笔记不属于公共源码。

## 用 Git 发布

如果已经安装 Git，也可在解压后的源码目录执行：

```sh
git init -b main
git add .
git commit -m "Initial release: StudyHarbor v0.1.0"
```

再按 GitHub 新仓库页面显示的实际地址添加远程仓库并推送。不要照抄别人的用户名或仓库地址。

## 通过 GitHub Pages 给别人试用

1. 确认 `index.html`、`.nojekyll` 与 `dist/` 位于仓库根目录。
2. 打开仓库的 Settings → Pages。
3. Source 选择 Deploy from a branch。
4. 选择包含源码的分支（通常为 `main`）和 `/ (root)`，保存。
5. 在 Actions 查看 Pages 部署结果，成功后从 Pages 设置页点击 Visit site。

根目录入口会自动跳转到 `dist/` 中的应用。应用本体是静态文件，不需要另购服务器或数据库。也可以只把 `dist/` 中的文件部署到其他静态托管服务。

托管网址和本地网址使用不同的数据空间。第一次切换前先导出 JSON，再到新地址导入。
