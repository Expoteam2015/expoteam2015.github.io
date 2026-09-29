// Expo House 共通スクリプト（全ページ共通）
const stickyBar = document.getElementById('stickyBar');
const header = document.querySelector('header');
if (stickyBar && header) window.addEventListener('scroll', () => {
  stickyBar.classList.toggle('visible', header.getBoundingClientRect().bottom < 0);
}, { passive: true });

// ハンバーガー
const hamburger = document.getElementById('hamburger');
const drawer = document.getElementById('mobileDrawer');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  drawer.classList.toggle('open');
});
document.addEventListener('click', (e) => {
  if (!hamburger.contains(e.target) && !drawer.contains(e.target)) {
    hamburger.classList.remove('open');
    drawer.classList.remove('open');
  }
});

// ===== Philosophy スライドショー（6秒自動・ランダムスタート・ドットで切替） =====
function initSlideshow(root, dotWrap) {
  if (!root) return;
  const slides = Array.from(root.querySelectorAll('.slide'));
  const dots = dotWrap ? Array.from(dotWrap.querySelectorAll('.slide-dot')) : [];
  if (slides.length < 2) return;
  let current = 0, timer;
  function goTo(n) {
    slides[current].classList.remove('active'); dots[current]?.classList.remove('active');
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('active'); dots[current]?.classList.add('active');
    const next = slides[(current + 1) % slides.length].querySelector('img');
    if (next) next.loading = 'eager';
  }
  function startTimer() { clearInterval(timer); timer = setInterval(() => goTo(current + 1), 6000); }
  goTo(Math.floor(Math.random() * slides.length));
  dots.forEach(d => d.addEventListener('click', () => { goTo(+d.dataset.index); startTimer(); }));
  root.parentElement.addEventListener('mouseenter', () => clearInterval(timer));
  root.parentElement.addEventListener('mouseleave', startTimer);
  startTimer();
}
initSlideshow(document.getElementById('philoSlideshow'), document.getElementById('philoDots'));

// ===== フッター上の水玉：画面幅に合わせて複製し、切れ目なく流す =====
(function () {
  const inner = document.querySelector('.footer-dots-inner');
  if (!inner) return;
  const unit = inner.querySelector('.footer-dots-unit');
  function fill() {
    const w = unit.getBoundingClientRect().width;
    if (!w) return;
    inner.style.setProperty('--unit-w', w + 'px');
    const need = Math.ceil(window.innerWidth / w) + 1;
    for (let i = inner.querySelectorAll('.footer-dots-unit').length; i < need; i++) inner.appendChild(unit.cloneNode(true));
  }
  fill();
  window.addEventListener('resize', fill);
})();

// ===== ハウス詳細：ギャラリー（サムネイルで切替） =====
document.querySelectorAll('[data-gallery]').forEach(g => {
  const main = g.querySelector('.gallery-main img');
  const thumbs = g.querySelectorAll('.gallery-thumb');
  thumbs.forEach(t => t.addEventListener('click', () => {
    thumbs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const img = t.querySelector('img');
    main.style.opacity = 0;
    setTimeout(() => { main.src = img.src; main.alt = img.alt; main.style.opacity = 1; }, 150);
  }));
});

// ===== ハウス一覧：Mixed / Women only の絞り込み =====
document.querySelectorAll('.house-filter').forEach(bar => {
  const btns = bar.querySelectorAll('button');
  const cards = document.querySelectorAll('.house-card-lg');
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-selected', x === b); });
    const f = b.dataset.filter;
    cards.forEach(c => c.classList.toggle('hidden', f !== 'all' && c.dataset.type !== f));
  }));
});

// ===== お問い合わせフォーム：ハウスの事前選択・必須チェック =====
(function () {
  const form = document.getElementById('enquiryForm');
  if (!form) return;
  const house = new URLSearchParams(location.search).get('house');
  if (house) { const cb = form.querySelector(`input[data-house="${house}"]`); if (cb) cb.checked = true; }
  const note = document.getElementById('womenNote');
  const updateNote = () => {
    if (!note) return;
    const male = form.querySelector('input[name="field_5218233"][value="0"]').checked;
    const women = [...form.querySelectorAll('input[data-house]')].some(c => c.checked && ['tate','halu','fuji'].includes(c.dataset.house));
    if (note) note.hidden = !(male && women);
  };
  form.addEventListener('change', updateNote); updateNote();
  form.addEventListener('submit', e => {
    let ok = true;
    form.querySelectorAll('.invalid, .invalid-group').forEach(el => el.classList.remove('invalid', 'invalid-group'));
    form.querySelectorAll('input[required]:not([type=radio]), select[required], textarea[required]').forEach(el => {
      const bad = (el.type === 'file' ? !el.files.length : !el.value.trim()) || (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value));
      if (bad) { el.classList.add('invalid'); ok = false; }
    });
    const groups = form.dataset.requiredGroups ? form.dataset.requiredGroups.split(',') : ['field_5218233', 'field_5248192', 'field_5248123'];
    groups.forEach(n => {
      if (!form.querySelector(`input[name="${n}"]:checked`)) { form.querySelector(`input[name="${n}"]`).closest('.chips').classList.add('invalid-group'); ok = false; }
    });
    const err = document.getElementById('formError');
    if (!ok) { e.preventDefault(); err.hidden = false; err.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    else err.hidden = true;
  });
})();

// ===== スタッフ応募フォーム：ファイル名表示・必須チェック =====
(function () {
  const form = document.getElementById('staffForm');
  if (!form) return;
  const file = form.querySelector('input[type=file]');
  const label = form.querySelector('.file-name');
  const initial = label.innerHTML;
  file.addEventListener('change', () => { label.innerHTML = file.files[0] ? '<i class="ti ti-paperclip"></i> ' + file.files[0].name : initial; });
  form.addEventListener('submit', e => {
    let ok = true;
    form.querySelectorAll('.invalid, .invalid-group').forEach(el => el.classList.remove('invalid', 'invalid-group'));
    form.querySelectorAll('input[required]:not([type=radio]):not([type=file]), select[required]').forEach(el => {
      const bad = !el.value.trim() || (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) || (el.name === 'field_5278038_y' && !/^\d{4}$/.test(el.value));
      if (bad) { el.classList.add('invalid'); ok = false; }
    });
    if (!form.querySelector('input[name="field_5278037"]:checked')) { form.querySelector('input[name="field_5278037"]').closest('.chips').classList.add('invalid-group'); ok = false; }
    if (!file.files.length) { file.closest('.file-drop').classList.add('invalid'); ok = false; }
    const err = document.getElementById('staffError');
    if (!ok) { e.preventDefault(); err.hidden = false; err.scrollIntoView({ behavior: 'smooth', block: 'center' }); } else err.hidden = true;
  });
})();
