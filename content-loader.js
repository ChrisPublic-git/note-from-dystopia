(async function () {
  try {
    const response = await fetch('/generated/posts.json');
    if (!response.ok) throw new Error('Could not load posts');

    const posts = await response.json();
    if (!posts.length) return;

    const esc = s => String(s || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');

    const url = p => `/generated/posts/${p.slug}.html`;

    // Dispatch feed
    const feed = document.getElementById('feed');

    if (feed) {
      feed.innerHTML = posts.map((p, i) => `
        <article class="dispatch">
          <div class="body">
            <h3><a href="${url(p)}">${esc(p.title)}</a></h3>
            <p>${esc(p.excerpt)}</p>
          </div>
          <div class="meta">
            <span class="no">Dispatch ${String(posts.length-i).padStart(3,'0')}</span>
            ${esc(p.date ? new Date(p.date).toLocaleDateString() : '')}
            <br>
            <span class="tag">${esc(p.category || 'Dispatch')}</span>
          </div>
        </article>
      `).join('');
    }

    // Featured
    const featured = posts.filter(p => p.featured).slice(0,3);
    if (!featured.length) return;

    const stage = document.querySelector('.feat-stage');
    const nav = document.querySelector('.title-nav');

    if (!stage || !nav) return;

    stage.innerHTML = `
      <div class="feat-arrows">
        <button class="feat-prev">&#8249;</button>
        <button class="feat-next">&#8250;</button>
      </div>
      ${featured.map((p,i) => `
        <article class="slide ${i===0?'current':''}"
          ${p.image ? `style="--img:url('${esc(p.image)}')"` : ''}>
          <span class="bignum">${String(i+1).padStart(2,'0')}</span>
          <div class="feat-kicker">${esc(p.category)}</div>
          <h2>${esc(p.title)}</h2>
          <p>${esc(p.excerpt)}</p>
          <a class="read" href="${url(p)}">Read dispatch &#8594;</a>
        </article>
      `).join('')}
    `;

    nav.innerHTML = featured.map((p,i) => `
      <li>
        <button class="${i===0?'current':''}">
          <span class="idx">${String(i+1).padStart(2,'0')}</span>
          ${esc(p.title)}
        </button>
      </li>
    `).join('');

    const slides = [...stage.querySelectorAll('.slide')];
    const buttons = [...nav.querySelectorAll('button')];
    let current = 0;

    function show(n) {
      current = (n + slides.length) % slides.length;
      slides.forEach((s,i) => s.classList.toggle('current',i===current));
      buttons.forEach((b,i) => b.classList.toggle('current',i===current));
    }

    buttons.forEach((b,i) => b.onclick = () => show(i));
    stage.querySelector('.feat-next').onclick = () => show(current+1);
    stage.querySelector('.feat-prev').onclick = () => show(current-1);

  } catch (err) {
    console.error(err);
  }
})();
