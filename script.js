(() => {
  'use strict';

  const WA_NUMBER = '6283830086964'; // nomor WhatsApp penjual
  const PRODUCTS = [
    { id: 'c1', cat: 'cheesecuit', name: 'Cheesecuit Original', price: 22000, emoji: '🍰', desc: 'Klasik, lembut, dengan dasar biskuit butter.' },
    { id: 'c2', cat: 'cheesecuit', name: 'Cheesecuit Oreo', price: 25000, emoji: '🍪', desc: 'Remahan oreo renyah di setiap gigitan.', tag: 'Terlaris' },
    { id: 'c3', cat: 'cheesecuit', name: 'Cheesecuit Coklat', price: 25000, emoji: '🍫', desc: 'Cokelat pekat yang lumer, manis pas.' },
    { id: 'c4', cat: 'cheesecuit', name: 'Cheesecuit Tiramisu', price: 27000, emoji: '🤎', desc: 'Aroma kopi dan taburan kakao ala tiramisu.' },
    { id: 'c5', cat: 'cheesecuit', name: 'Cheesecuit Red Velvet', price: 27000, emoji: '❤️', desc: 'Red velvet lembut dengan krim cheese di atasnya.', tag: 'Favorit' },
    { id: 'd1', cat: 'dalgona', name: 'Dalgona Coffee', price: 18000, emoji: '☕', desc: 'Kopi kocok tebal di atas susu dingin.' }
  ];

  const $ = id => document.getElementById(id);
  const rp = n => 'Rp ' + n.toLocaleString('id-ID');
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem('cd-cart')) || {}; } catch (e) { cart = {}; }
  const save = () => { try { localStorage.setItem('cd-cart', JSON.stringify(cart)); } catch (e) {} };

  // ---------- Produk ----------
  let currentFilter = 'all';
  const actionHTML = p => cart[p.id]
    ? `<div class="pstep" role="group" aria-label="Jumlah ${p.name}"><button data-id="${p.id}" data-d="-1" aria-label="Kurangi ${p.name}">−</button><b>${cart[p.id]}</b><button data-id="${p.id}" data-d="1" aria-label="Tambah ${p.name}">+</button></div>`
    : `<button class="add" data-id="${p.id}">Tambah</button>`;

  function renderProducts(filter = currentFilter) {
    currentFilter = filter;
    $('products').innerHTML = PRODUCTS.filter(p => filter === 'all' || p.cat === filter).map(p => `
      <article class="prod${cart[p.id] ? ' in-cart' : ''}" data-id="${p.id}">
        <div class="pic">
          ${p.tag ? `<span class="tag tag-${p.tag.toLowerCase()}">${p.tag}</span>` : ''}
          <span class="emo" aria-hidden="true">${p.emoji}</span>
        </div>
        <div class="body">
          <h3>${p.name}</h3><p>${p.desc}</p>
          <div class="row"><span class="price">${rp(p.price)}</span><div class="act">${actionHTML(p)}</div></div>
        </div>
      </article>`).join('');
  }
  renderProducts();

  // Perbarui satu kartu saja agar fokus keyboard tidak hilang
  function refreshCard(id) {
    const card = document.querySelector(`.prod[data-id="${id}"]`);
    if (!card) return;
    const act = card.querySelector('.act'), p = PRODUCTS.find(x => x.id === id);
    const hadFocus = act.contains(document.activeElement);
    act.innerHTML = actionHTML(p);
    card.classList.toggle('in-cart', !!cart[id]);
    if (hadFocus) (act.querySelector('[data-d="1"]') || act.querySelector('.add')).focus();
  }

  document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(x => x.classList.toggle('active', x === c));
    renderProducts(c.dataset.f);
  }));
  $('products').addEventListener('click', e => {
    const b = e.target.closest('button[data-id]');
    if (!b) return;
    const isAdd = b.classList.contains('add');
    change(b.dataset.id, isAdd ? 1 : +b.dataset.d);
    if (isAdd) toast('Ditambahkan ke keranjang');
  });

  // ---------- Keranjang ----------
  function change(id, d) {
    cart[id] = (cart[id] || 0) + d;
    if (cart[id] <= 0) delete cart[id];
    save(); renderCart(); refreshCard(id);
  }
  function renderCart() {
    const ids = Object.keys(cart);
    let total = 0, count = 0;
    $('items').innerHTML = ids.length ? ids.map(id => {
      const p = PRODUCTS.find(x => x.id === id); if (!p) return '';
      total += p.price * cart[id]; count += cart[id];
      return `<div class="item"><b>${p.name}</b><span>${rp(p.price * cart[id])}</span>
        <div class="qty"><button data-id="${id}" data-d="-1" aria-label="Kurangi">−</button><span>${cart[id]}</span><button data-id="${id}" data-d="1" aria-label="Tambah">+</button></div></div>`;
    }).join('') : '<p class="empty">Keranjang masih kosong. Pilih menu dulu, ya.</p>';
    $('total').textContent = rp(total);
    $('cartCount').textContent = count;
  }
  $('items').addEventListener('click', e => {
    const b = e.target.closest('button[data-id]');
    if (b) change(b.dataset.id, +b.dataset.d);
  });
  renderCart();

  const drawer = $('drawer'), overlay = $('overlay');
  function toggleCart(open) {
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', !open);
    overlay.hidden = !open;
    if (open) $('closeCart').focus(); else $('openCart').focus();
  }
  $('openCart').addEventListener('click', () => toggleCart(true));
  $('closeCart').addEventListener('click', () => toggleCart(false));
  overlay.addEventListener('click', () => toggleCart(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) toggleCart(false); });

  $('checkout').addEventListener('click', () => {
    const ids = Object.keys(cart), name = $('cname').value.trim(), addr = $('caddr').value.trim();
    if (!ids.length) return ($('cerr').textContent = 'Keranjang masih kosong.');
    if (name.length < 2 || addr.length < 5) return ($('cerr').textContent = 'Isi nama dan alamat antar dulu.');
    $('cerr').textContent = '';
    let total = 0;
    const lines = ids.map(id => {
      const p = PRODUCTS.find(x => x.id === id); total += p.price * cart[id];
      return `- ${p.name} x${cart[id]} = ${rp(p.price * cart[id])}`;
    });
    const msg = `Halo, saya mau pesan di helloChesee:\n${lines.join('\n')}\n\nTotal: ${rp(total)}\nNama: ${name}\nAlamat: ${addr}`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });

  // ---------- Toast ----------
  let tt;
  function toast(m) {
    const t = $('toast'); t.textContent = m; t.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 1600);
  }


  $('year').textContent = new Date().getFullYear();
})();