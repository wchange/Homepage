import { readFile, writeFile, readdir, mkdir, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
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
const files = (await readdir(path.join(root, 'content/devlog'))).filter(file => file.endsWith('.md'));
const posts = await Promise.all(files.map(async file => {
  const raw = (await readFile(path.join(root, 'content/devlog', file), 'utf8')).replace(/\r\n/g, '\n');
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
posts.sort((a,b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
const stamp = post => `<span>${escape(post.category)}</span><time datetime="${post.date}">${post.date.replaceAll('-', ' / ')}</time>${post.sample === 'true' ? '<span class="sample-label">样例日志</span>' : ''}`;
function shell(title, description, prefix, body) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · Atelier Seal &amp; Shark</title><meta name="description" content="${escape(description)}"><link rel="icon" href="${prefix}assets/studio-logo.png"><link rel="stylesheet" href="${prefix}styles.css"><link rel="stylesheet" href="${prefix}devlog.css?v=${cssVersion}"></head><body><a class="skip-link" href="#main">跳转到主要内容</a><header class="site-header wrap"><a class="wordmark" href="${prefix}index.html"><span>Atelier</span><strong>Seal <i>&amp;</i> Shark<span class="brand-dot">.</span></strong></a><nav aria-label="主导航"><a href="${prefix}index.html#games">游戏作品</a><a href="${prefix}devlog/" aria-current="page">开发日志</a><a href="${prefix}index.html#studio">关于我们</a></nav></header><main id="main">${body}</main><footer class="site-footer wrap"><span>© ${new Date().getFullYear()} Atelier Seal &amp; Shark</span><span>Made by two. Shared with you.</span><a href="${prefix}index.html">回到工作室首页 ↗</a></footer></body></html>`;
}
function entry(post, prefix) {
  return `<a class="journal-entry" href="${prefix}devlog/${post.slug}/"><img src="${prefix}assets/${post.cover}" alt="${escape(post.coverAlt)}" width="2560" height="1440" loading="lazy"><div><div class="post-meta">${stamp(post)}</div><h3>${escape(post.title)}</h3><p>${escape(post.summary)}</p><span class="text-link">阅读手记 ↗</span></div></a>`;
}
await mkdir(path.join(root, 'devlog'), {recursive:true});
for (const post of posts) {
  const folder = path.join(root, 'devlog', post.slug);
  await mkdir(folder, {recursive:true});
  const body = `<article class="journal-article"><header class="article-header"><a class="text-link" href="../">← 所有开发日志</a><div class="post-meta">${stamp(post)}</div><h1>${escape(post.title)}</h1><p class="article-lead">${escape(post.summary)}</p><span class="article-byline">文 / Atelier Seal &amp; Shark</span>${post.sample === 'true' ? '<aside class="sample-note">这是一篇用于预览阅读效果的样例，配图来自游戏现有素材，不代表本次开发更新公告。</aside>' : ''}</header><div class="article-body">${post.html}</div><footer class="article-footer"><span>感谢你读到这里。</span><a class="text-link" href="../">返回开发日志 ↗</a></footer></article>`;
  await writeFile(path.join(folder,'index.html'), shell(post.title,post.summary,'../../',body));
}
const list = `<section class="journal-list wrap"><header class="journal-intro"><p class="eyebrow">NOTES FROM OUR LITTLE STUDIO</p><h1>开发日志<span class="pink-dot">。</span></h1><p>画笔、代码，还有小岛慢慢成形的日常。</p></header><div>${posts.map(post => entry(post,'../')).join('\n')}</div></section>`;
await writeFile(path.join(root,'devlog/index.html'),shell('开发日志','来自 Atelier Seal & Shark 的开发手记。','../',list));
let home = await readFile(path.join(root,'index.html'),'utf8');
const latest = `<section class="journal-home wrap" aria-labelledby="journal-title"><div class="section-heading"><div><p class="eyebrow">FROM THE DEVLOG</p><h2 id="journal-title">工作室手记</h2></div><a class="text-link" href="devlog/">所有开发日志 ↗</a></div>${posts.slice(0,3).map(post => entry(post,'')).join('\n')}</section>`;
// 首页可不展示日志推荐，日志列表与文章仍独立生成。
home = home.replace(/<!-- DEVLOG:START -->[\s\S]*?<!-- DEVLOG:END -->/, `<!-- DEVLOG:START -->\n${latest}\n<!-- DEVLOG:END -->`);
await writeFile(path.join(root,'index.html'),home);
if (process.argv.includes('--package')) {
  const out = path.join(root,'_site');
  await mkdir(out,{recursive:true});
  for (const file of ['index.html','styles.css','script.js','devlog.css','contact.css','game.css','games','.nojekyll','assets','devlog']) await cp(path.join(root,file),path.join(out,file),{recursive:true});
}
console.log(`已生成 ${posts.length} 篇开发日志和日志列表；首页存在预留区时同步更新推荐。`);
