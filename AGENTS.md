# 网站维护规则

## 角色译名

1. 以 Save Shark 项目 `Assets/Local Settings/Tables/CharacterNames_en.asset` 中的英文显示名为准。通过同目录的 `CharacterNames Shared Data.asset` 和 `CharacterNames_zh-Hans.asset` 按条目 ID 对照中英文，保留英文显示名的拼写和大小写。
2. 本地化表缺少译名，或项目内出现多个写法时，先向用户确认，再更新官网。
3. 更新译名时，检查首页、作品详情、开发日志、图片说明和 RSS 中的相关内容。开发日志从 `content/devlog/` 下的 Markdown 源文件修改，再运行 `node scripts/build-devlog.mjs` 重新生成页面和订阅源。
