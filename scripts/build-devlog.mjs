import { readFile, writeFile, readdir, mkdir, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const siteUrl = 'https://sealshark.cn';
const cssVersion = createHash('sha256')
  .update(await readFile(path.join(root, 'devlog.css')))
  .digest('hex').slice(0, 8);
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeUrl = value => {
  if (!/^(https:\/\/|(?:\.\.\/)*assets\/)/.test(value)) throw new Error(`不支持的链接: ${value}`);
  return escape(value);
};
function inline(value) {
  return value.split(/(\[[^\]]+\]\([^)]+\))/g).map(part => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    return link ? `<a href="${safeUrl(link[2])}">${escape(link[1])}</a>` : escape(part);
  }).join('');
}
function markdown(body) {
  return body.trim().split(/\n\s*\n/).map(block => {
    const image = block.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      const figureClass = /\.gif$/i.test(image[2]) ? ' class="devlog-animation"' : '';
      return `<figure${figureClass}><img src="${safeUrl(image[2])}" alt="${escape(image[1])}" loading="lazy"><figcaption>${escape(image[1])}</figcaption></figure>`;
    }
    if (block.startsWith('## ')) return `<h2>${escape(block.slice(3))}</h2>`;
    return `<p>${inline(block.replace(/\n/g, ' '))}</p>`;
  }).join('\n');
}
async function readPosts(directory) {
  const files = (await readdir(directory)).filter(file => file.endsWith('.md'));
  const posts = await Promise.all(files.map(async file => {
    const raw = (await readFile(path.join(directory, file), 'utf8')).replace(/\r\n/g, '\n');
    const match = raw.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
    if (!match) throw new Error(`文章缺少元数据: ${file}`);
    const meta = Object.fromEntries(match[1].split('\n').map(line => {
      const colon = line.indexOf(':');
      if (colon < 1) throw new Error(`无效元数据: ${file}`);
      return [line.slice(0,colon).trim(), line.slice(colon+1).trim()];
    }));
    for (const key of ['title','date','category','summary','cover','coverAlt']) if (!meta[key]) throw new Error(`${file} 缺少 ${key}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date) || !/^[\w-]+\.(jpg|png|webp)$/.test(meta.cover)) throw new Error(`日期或封面无效: ${file}`);
    const slug = file.replace(/\.md$/, '');
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`文件名需为小写英文和连字符: ${file}`);
    return {...meta, slug, html:markdown(match[2])};
  }));
  return posts.sort((a,b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}


const languages = [
  {
    lang: 'zh-CN',
    directory: 'devlog',
    title: '开发日志',
    description: '来自 Atelier Seal & Shark 的开发手记。',
    intro: '画笔、代码，还有小岛慢慢成形的日常。',
    dot: '。',
    skip: '跳转到主要内容',
    nav: '主导航',
    games: '游戏作品',
    about: '关于我们',
    languageCode: '中文',
    switchDescription: 'Read in English',
    languageLabel: '语言',
    home: '回到工作室首页',
    archive: '所有开发日志',
    read: '阅读手记',
    byline: '文 /',
    thanks: '感谢你读到这里。',
    back: '返回开发日志',
    subscribe: 'RSS 订阅',
    latest: '工作室手记',
    sample: '样例日志',
    sampleNote: '这是一篇用于预览阅读效果的样例，配图来自游戏现有素材，不代表本次开发更新公告。',
  },
  {
    lang: 'en',
    directory: 'en/devlog',
    title: 'Devlog',
    description: 'Development notes from Atelier Seal & Shark.',
    intro: 'Brushstrokes, code, and everyday notes on bringing our island to life.',
    dot: '.',
    skip: 'Skip to main content',
    nav: 'Main navigation',
    games: 'Games',
    about: 'About',
    languageCode: 'EN',
    switchDescription: '切换到中文',
    languageLabel: 'Language',
    home: 'Back to studio home',
    archive: 'All devlog posts',
    read: 'Read the post',
    byline: 'By',
    thanks: 'Thanks for reading.',
    back: 'Back to the devlog',
    subscribe: 'Subscribe via RSS',
    latest: 'Studio notes',
    sample: 'Sample post',
    sampleNote: 'This sample previews the devlog layout with existing game art.',
  },
];

const studio = 'Atelier Seal &amp; Shark';
const postsByLanguage = await Promise.all(languages.map(({lang}) =>
  readPosts(path.join(root, 'content/devlog', lang === 'en' ? 'en' : ''))
));
const journalUrl = locale => `${siteUrl}/${locale.directory}/`;
function renderRss(posts, locale) {
  const url = journalUrl(locale);
  const items = posts.map(post => {
    const articleUrl = escape(new URL(post.slug + '/', url).href);
    const pubDate = new Date(post.date + 'T00:00:00+08:00').toUTCString();
    return `    <item>
      <title>${escape(post.title)}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <description>${escape(post.summary)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(locale.title)} · ${studio}</title>
    <link>${url}</link>
    <description>${escape(locale.description)}</description>
    <language>${locale.lang}</language>
    <atom:link href="${url}rss.xml" rel="self" type="application/rss+xml"/>
${items.join('\n')}
  </channel>
</rss>
`;
}

const stamp = (post, locale) => `<span>${escape(post.category)}</span><time datetime="${post.date}">${post.date.replaceAll('-', ' / ')}</time>${post.sample === 'true' ? `<span class="sample-label">${locale.sample}</span>` : ''}`;
function shell(title, description, body, locale, other, slug = '', translated = true) {
  const page = slug ? slug + '/' : '';
  const prefix = slug ? '../../' : '../';
  const assets = locale.lang === 'en' ? prefix + '../' : prefix;
  const feed = slug ? '../rss.xml' : 'rss.xml';
  const journal = slug ? '../' : './';
  const alternate = translated ? `<link rel="alternate" hreflang="${other.lang}" href="${journalUrl(other)}${page}">` : '';
  const switchHref = assets + other.directory + '/' + (translated ? page : '');
  const currentLanguage = `<span lang="${locale.lang}" aria-current="true">${locale.languageCode}</span>`;
  const otherLanguage = `<a href="${switchHref}" lang="${other.lang}" hreflang="${other.lang}" aria-label="${locale.switchDescription}">${other.languageCode}</a>`;
  const options = locale.lang === 'en' ? otherLanguage + currentLanguage : currentLanguage + otherLanguage;
  return `<!doctype html><html lang="${locale.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · ${studio}</title><meta name="description" content="${escape(description)}"><link rel="alternate" type="application/rss+xml" title="${locale.title} RSS" href="${feed}"><link rel="alternate" hreflang="${locale.lang}" href="${journalUrl(locale)}${page}">${alternate}<link rel="icon" href="${assets}assets/studio-logo.png"><link rel="stylesheet" href="${assets}styles.css"><link rel="stylesheet" href="${assets}devlog.css?v=${cssVersion}"></head><body><a class="skip-link" href="#main">${locale.skip}</a><header class="site-header wrap"><a class="wordmark" href="${prefix}"><span>Atelier</span><strong>Seal <i>&amp;</i> Shark<span class="brand-dot">.</span></strong></a><nav aria-label="${locale.nav}"><a href="${prefix}#games">${locale.games}</a><a href="${journal}"${slug ? '' : ' aria-current="page"'}>${locale.title}</a><a href="${prefix}#studio">${locale.about}</a><span class="language-switch" role="group" aria-label="${locale.languageLabel}">${options}</span></nav></header><main id="main">${body}</main><footer class="site-footer wrap"><span>© ${new Date().getFullYear()} ${studio}</span><span lang="en">Made by two. Shared with you.</span><a href="${prefix}">${locale.home} ↗</a></footer></body></html>`;
}
function entry(post, locale, href, assets) {
  return `<a class="journal-entry" href="${href}${post.slug}/"><img src="${assets}assets/${post.cover}" alt="${escape(post.coverAlt)}" width="2560" height="1440" loading="lazy"><div><div class="post-meta">${stamp(post, locale)}</div><h3>${escape(post.title)}</h3><p>${escape(post.summary)}</p><span class="text-link">${locale.read} ↗</span></div></a>`;
}
for (const [index, locale] of languages.entries()) {
  const other = languages[1 - index];
  const posts = postsByLanguage[index];
  const translatedSlugs = new Set(postsByLanguage[1 - index].map(post => post.slug));
  const directory = path.join(root, locale.directory);
  const assets = locale.lang === 'en' ? '../../' : '../';
  await mkdir(directory, {recursive:true});
  await writeFile(path.join(directory, 'rss.xml'), renderRss(posts, locale));
  for (const post of posts) {
    const folder = path.join(directory, post.slug);
    await mkdir(folder, {recursive:true});
    const body = `<article class="journal-article"><header class="article-header"><a class="text-link" href="../">← ${locale.archive}</a><div class="post-meta">${stamp(post, locale)}</div><h1>${escape(post.title)}</h1><p class="article-lead">${escape(post.summary)}</p><span class="article-byline">${locale.byline} ${studio}</span>${post.sample === 'true' ? `<aside class="sample-note">${locale.sampleNote}</aside>` : ''}</header><div class="article-body">${post.html}</div><footer class="article-footer"><span>${locale.thanks}</span><div class="article-footer-links"><a class="text-link" href="../rss.xml">${locale.subscribe}</a><a class="text-link" href="../">${locale.back} ↗</a></div></footer></article>`;
    await writeFile(path.join(folder, 'index.html'), shell(post.title, post.summary, body, locale, other, post.slug, translatedSlugs.has(post.slug)));
  }
  const list = `<section class="journal-list wrap"><header class="journal-intro"><p class="eyebrow" lang="en">NOTES FROM OUR LITTLE STUDIO</p><h1>${locale.title}<span class="pink-dot">${locale.dot}</span></h1><p class="journal-intro-summary">${locale.intro}</p><a class="journal-rss" href="rss.xml">${locale.subscribe} <span aria-hidden="true">↗</span></a></header><div>${posts.map(post => entry(post, locale, '', assets)).join('\n')}</div></section>`;
  await writeFile(path.join(directory, 'index.html'), shell(locale.title, locale.description, list, locale, other));

  const homePath = path.join(path.dirname(directory), 'index.html');
  const home = await readFile(homePath, 'utf8');
  const latest = `<section class="journal-home wrap" aria-labelledby="journal-title"><div class="section-heading"><div><p class="eyebrow" lang="en">FROM THE DEVLOG</p><h2 id="journal-title">${locale.latest}</h2></div><a class="text-link" href="devlog/">${locale.archive} ↗</a></div>${posts.slice(0,3).map(post => entry(post, locale, 'devlog/', assets.slice(3))).join('\n')}</section>`;
  const updatedHome = home.replace(/<!-- DEVLOG:START -->[\s\S]*?<!-- DEVLOG:END -->/, `<!-- DEVLOG:START -->\n${latest}\n<!-- DEVLOG:END -->`);
  if (updatedHome !== home) await writeFile(homePath, updatedHome);
}
if (process.argv.includes('--package')) {
  const out = path.join(root,'_site');
  await mkdir(out,{recursive:true});
  for (const file of ['index.html','styles.css','script.js','devlog.css','contact.css','game.css','games','.nojekyll','assets','devlog','en']) await cp(path.join(root,file),path.join(out,file),{recursive:true});
}
console.log(`已生成开发日志（中文 ${postsByLanguage[0].length} 篇，英文 ${postsByLanguage[1].length} 篇）。`);
