const fs = require('fs');
const path = require('path');

const NOTES_DIR = path.join(process.cwd(), 'notes');
const OUT_DIR = path.join(process.cwd(), 'generated');
const POSTS_DIR = path.join(OUT_DIR, 'posts');

function parseFrontmatter(text) {
  if (!text.startsWith('---')) {
    return { data: {}, body: text.trim() };
  }

  const end = text.indexOf('\n---', 3);
  if (end === -1) {
    return { data: {}, body: text.trim() };
  }

  const raw = text.slice(3, end).trim();
  const body = text.slice(end + 4).trim();
  const data = {};

  raw.split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  });

  return { data, body };
}

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function markdownToHtml(md = '') {
  return md
    .split(/\n{2,}/)
    .map(block => {
      if (block.startsWith('# ')) {
        return `<h1>${escapeHtml(block.slice(2))}</h1>`;
      }
      if (block.startsWith('## ')) {
        return `<h2>${escapeHtml(block.slice(3))}</h2>`;
      }

      const linked = escapeHtml(block).replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener">$1</a>'
      );

      return `<p>${linked.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);
if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR);

const files = fs.existsSync(NOTES_DIR)
  ? fs.readdirSync(NOTES_DIR).filter(f => f.endsWith('.md'))
  : [];

const posts = files.map(filename => {
  const fullPath = path.join(NOTES_DIR, filename);
  const text = fs.readFileSync(fullPath, 'utf8');
  const { data, body } = parseFrontmatter(text);

  const slug = filename.replace(/\.md$/, '');

  return {
    slug,
    title: data.title || slug,
    date: data.date || '',
    excerpt: data.excerpt || '',
    category: data.category || 'Dispatch',
    featured: data.featured === true || data.featured === 'true',
    image: data.image || '',
    topics: data.topics || [],
    body,
  };
});

posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

fs.writeFileSync(
  path.join(OUT_DIR, 'posts.json'),
  JSON.stringify(posts, null, 2)
);

posts.forEach(post => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(post.title)} — Notes from Dystopia</title>
<meta name="description" content="${escapeHtml(post.excerpt)}">
<style>
body{
  background:#0d0d0d;
  color:#f0f0f0;
  font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;
  margin:0;
}
main{
  max-width:760px;
  margin:0 auto;
  padding:60px 22px 100px;
}
a{color:#f0f0f0}
.meta{
  font-size:12px;
  text-transform:uppercase;
  letter-spacing:.12em;
  opacity:.6;
  margin-bottom:18px;
}
h1{
  font-size:clamp(42px,8vw,74px);
  line-height:.95;
  letter-spacing:-.04em;
  margin:0 0 32px;
}
article{
  font-size:19px;
  line-height:1.65;
}
article p{
  margin:0 0 1.5em;
}
.back{
  display:inline-block;
  margin-bottom:40px;
  font-weight:700;
}
</style>
</head>
<body>
<main>
<a class="back" href="/">← Notes from Dystopia</a>
<div class="meta">${escapeHtml(post.category)} · ${escapeHtml(post.date)}</div>
<h1>${escapeHtml(post.title)}</h1>
<article>${markdownToHtml(post.body)}</article>
</main>
</body>
</html>`;

  fs.writeFileSync(path.join(POSTS_DIR, `${post.slug}.html`), html);
});

console.log(`Built ${posts.length} dispatch(es).`);
