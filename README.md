# Atelier Seal & Shark

鲨乘豹工作室主页。HTML、CSS 和 JavaScript 静态网站；开发日志由 Markdown 生成，无第三方构建依赖。

- index.html：介绍文案、作品信息和 Steam 链接。
- styles.css：视觉样式、移动端适配和减少动画设置。
- script.js：截图预览和页脚年份。
- assets/：来自 Save Shark 项目的宣传图、截图与工作室标志。

素材来源：Assets/Arts/SteamPage/、Assets/Arts/UI/Logos/。原游戏项目未修改。

本地预览：使用任意静态 HTTP 服务器，或直接打开 index.html。

Steam：https://store.steampowered.com/app/3566350/Seal_Shark_Diary/
Demo：https://store.steampowered.com/app/4678550/

GitHub Pages 的发布目录应为仓库根目录，入口为 index.html。.nojekyll 让文件直接作为静态网站发布，原 _config.yml 不影响入口。合并并推送到 Pages 配置的发布分支后，线上网站才会更新。

如绑定新域名，请同步修改 index.html 中 og:image 的绝对地址。尚未提供的邮箱和社交账号未添加。

## 开发日志

文章源文件放在 content/devlog/，使用 YYYY-MM-DD-slug.md 文件名。复制样例后修改头部的 title、date、category、summary、cover、coverAlt 和正文；正式日志应将 sample 改为 false。

支持的正文语法：普通段落、二级标题、独立图片和行内链接。图片路径沿用样例的 ../../assets/文件名。元数据值使用单行纯文本，无需引号。

执行 node scripts/build-devlog.mjs 更新静态文章、日志列表与首页最新三篇推荐。生成的 devlog/ 文件可以随代码一并提交；请编辑 Markdown 源文件，不要手改生成页。

执行 node scripts/build-devlog.mjs --package 会额外输出 _site/ 发布目录。构建输出目录为忽略文件，每次发布应在干净检出中构建。

已准备 .github/workflows/pages.yml：推送到 master 后构建并部署。启用前需在 GitHub Settings → Pages 将 Source 设置为 GitHub Actions。当前仅本地预览，尚未修改线上设置。

## 联系方式与手机适配

联系方式与团队介绍合并。QQ 群使用官方二维码原图 assets/qq-group-official.jpg，并提供入群邀请链接；小红书、B站和 Steam 提供 HTTPS 链接与可展开的二维码。链接能否唤起 App 由系统、平台与浏览器决定。

二维码图片随网站发布，无在线二维码服务依赖。如要重新生成链接二维码，运行 npm ci --ignore-scripts，再运行 node scripts/generate-qr.cjs。该命令会解码校验生成的图片。更新分享链接时，同步修改 index.html 与 scripts/generate-qr.cjs；官方 QQ 原图需使用最新分享图片替换。

已在 320px 和 390px 视口检查首页、联系区域与文章阅读布局，未发现横向溢出。尚未进行真实手机上的 App 唤起验证。

## 首页与作品详情

首页保留作品标题宣传大图、三张可放大的截图、中英文 Steam 愿望单按钮，以及合并的团队介绍和联系方式。宣传大图与“了解作品”链接跳转至独立页面 games/seal-shark-diary/index.html。

作品详情页包括游戏简介、故事大纲、角色介绍、玩法介绍和截图画廊；角色图片来自 Save Shark 的 Assets/Arts/Character/。布局文件为 game.css。开发日志继续通过导航独立访问，首页不再展示日志推荐。

发布打包脚本已包含 games/ 和 game.css。详情页检查了 320px、390px 视口，未出现横向溢出。故事与玩法文案依据现有公开游戏介绍整理，后续可直接修改详情页。

## 作品详情截图轮播

游戏详情页使用 7 张实际游戏截图，来自 Assets/Arts/SteamPage/。在详情页 .game-carousel 的缩略图按钮上维护图片路径和 data-caption。

截图每 5 秒切换，可暂停、前后翻页、点击缩略图、使用左右方向键、手机横向滑动；点击大图可放大。鼠标悬停、键盘焦点在画廊内、打开大图、页面隐藏或画廊离开可视范围时暂停计时。系统启用减少动态效果时默认不自动播放。

已验证自动播放、首尾循环、缩略图切换、暂停按钮、大图对应关系和手机宽度布局；触屏滑动尚未在实体手机上验证。
