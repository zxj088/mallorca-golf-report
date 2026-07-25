# 马略卡高尔夫月住计划网站

这个仓库/目录用于发布 2026 年 12 月至 2027 年 1 月马略卡高尔夫月住计划。

## GitHub Pages 发布方式

1. 把本目录提交到 GitHub 仓库。
2. 在 GitHub 仓库 Settings → Pages 中选择：
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /docs
3. 保存后，GitHub 会生成访问链接。

## 每日更新方式

每日监控会更新：

- `2026-07-24_马略卡高尔夫月住更新报告.md`
- `docs/data/report.json`

网站页面 `docs/index.html` 会自动读取 `docs/data/report.json`，所以只要数据文件更新并推送到 GitHub，GitHub Pages 页面就会同步显示新内容。
