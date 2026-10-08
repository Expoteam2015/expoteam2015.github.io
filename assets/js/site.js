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
  // 入居希望年：フォームメーラーに年の項目がないので、今年と来年を選べるようにし、送信時にお問い合わせ内容の先頭に書き込む
  const year = form.querySelector('[data-moveyear]');
  if (year) { const y = new Date().getFullYear(); [y, y + 1].forEach(v => year.add(new Option(String(v), String(v)))); }
  const MOVE_TAG = /^\[Move-in \/ 入居希望: [^\]\n]*\]\n/;
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
    if (!ok) { e.preventDefault(); err.hidden = false; err.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    err.hidden = true;
    // 電話番号は任意。フォームメーラー側は必須なので、空なら「0」を送る（数字・+・-・( ) 以外は受け付けないので空白などを除く）
    const tel = form.querySelector('input[name="field_5548882"]');
    if (tel) { const v = tel.value.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/[^0-9+\-()]/g, ''); tel.value = v || '0'; }
    const msg = form.querySelector('textarea[name="field_5248305"]');
    const mon = form.querySelector('select[name="field_5248296"]');
    if (msg && year) {
      const body = msg.value.replace(MOVE_TAG, '');
      const when = year.value ? year.value + (mon && mon.value !== '' ? '-' + String(+mon.value + 1).padStart(2, '0') : '') : '';
      msg.value = when ? '[Move-in / 入居希望: ' + when + ']\n' + body : body;
    }
  });
})();

// ===== お問い合わせ完了ページ：GA4 に generate_lead を送る（キーイベント用）
// フォームメーラーの送信完了後に /en/contact/thanks/ へ移る。再読み込みで二重に数えないよう、同じタブでは1回だけ送る
(function () {
  if (location.pathname !== '/en/contact/thanks/') return;
  try { if (sessionStorage.getItem('eh_lead_sent')) return; } catch (err) {}
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'generate_lead', { form_name: 'sharehouse_enquiry', transport_type: 'beacon' });
  try { sessionStorage.setItem('eh_lead_sent', '1'); } catch (err) {}
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

// ===== トップへ戻るボタン =====
(function () {
  const b = document.createElement('button');
  b.className = 'to-top'; b.type = 'button';
  b.setAttribute('aria-label', ({ ja:'ページの先頭へ戻る', zh:'回到頁首', ko:'맨 위로' })[document.documentElement.lang.slice(0,2)] || 'Back to top');
  b.innerHTML = '<i class="ti ti-arrow-up"></i><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">↑</span>';
  document.body.appendChild(b);
  window.addEventListener('scroll', () => b.classList.toggle('show', window.scrollY > 600), { passive: true });
  b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

// ===== 言語切替：クリックで開閉、カーソルが離れても少し残す =====
document.querySelectorAll('.lang-wrap').forEach(w => {
  const btn = w.querySelector('.lang-btn'); let t;
  const open = () => { clearTimeout(t); w.classList.add('open'); };
  const close = (delay) => { clearTimeout(t); t = setTimeout(() => w.classList.remove('open'), delay); };
  w.addEventListener('mouseenter', open);
  w.addEventListener('mouseleave', () => close(700));
  btn.addEventListener('click', e => { e.preventDefault(); w.classList.contains('open') ? close(0) : open(); });
  document.addEventListener('click', e => { if (!w.contains(e.target)) close(0); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(0); });
});

// お問い合わせへのリンクが押されたら GA4 に sharehouse_contact_click を送る（お問い合わせページ /xx/contact/ へのリンクだけ）
// ・ページ移動は止めない（preventDefault しない）／gtag が無い・失敗しても何もせず普通にリンクが動く
// ・どのボタンかは data-cta、無ければ置き場所（ヘッダー・スマホ下部など）から判定
(function () {
  var CONTACT = /^\/(en|ja|zh|ko)\/contact\/$/;
  var PLACES = [['.sticky-bar','sticky_bar'],['.mobile-bottom-bar','mobile_bottom_bar'],['.mobile-drawer','menu'],['header','header'],
                ['footer','footer'],['.facts-card','facts_card'],['.index-cta','page_bottom_cta'],['main','content']];
  document.addEventListener('click', function (e) {
    try {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || typeof window.gtag !== 'function') return;
      var u = new URL(a.getAttribute('href'), location.href);
      if (u.origin !== location.origin || !CONTACT.test(u.pathname)) return;
      if (a.closest('.lang-dropdown, .drawer-lang, .footer-lang-grid')) return; // 言語切替は数えない
      var where = a.getAttribute('data-cta');
      for (var i = 0; !where && i < PLACES.length; i++) if (a.closest(PLACES[i][0])) where = PLACES[i][1];
      window.gtag('event', 'sharehouse_contact_click', {
        link_url: u.href,
        link_text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100),
        page_path: location.pathname,
        cta_location: where || 'other',
        transport_type: 'beacon'
      });
    } catch (err) { /* 計測に失敗してもリンクはそのまま動く */ }
  }, true);
})();
