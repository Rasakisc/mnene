// 1. Navigasi, scrollspy, animasi scroll, dan buku tamu

(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 2. Navigasi anchor dengan scroll halus
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;

      target.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', link.hash);
      $('#navToggle').checked = false;
    });
  });

  // 3. Menentukan section aktif berdasarkan posisi scroll
  const links = $$('.nav__link');
  const steps = $$('.step');
  const sections = $$('section[id], article[id]');

  const line = () => innerHeight * 0.45;

  const current = () => {
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) {
      return sections[sections.length - 1];
    }
    let hit = sections[0];
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= line()) hit = s;
    }
    return hit;
  };

  const paint = () => {
    const hit = current();
    links.forEach((l) => l.classList.toggle('is-active', l.hash === '#' + hit.id));
    steps.forEach((s) => s.classList.toggle('is-active', s === hit));
  };

  // 4. Navbar sticky dan tombol kembali ke atas
  const nav = $('#nav');
  const top = $('#toTop');
  const hero = $('.hero');
  const down = $('.hero__down');
  const navToggle = $('#navToggle');
  const burger = $('.nav__burger');
  const syncBurger = () => burger.setAttribute('aria-expanded', String(navToggle.checked));
  navToggle.addEventListener('change', syncBurger);
  syncBurger();

  // 5. Memudarkan panah sampul saat halaman digulir
  const fadeArrow = () => {
    const span = Math.max(1, (down.offsetTop + down.offsetHeight - hero.offsetTop) * 0.85);
    const f = Math.min(1, Math.max(0, 1 - (scrollY - hero.offsetTop) / span));
    down.style.setProperty('--fade', f.toFixed(3));
    down.classList.toggle('is-gone', f <= 0.002);
  };

  // 6. Menyatukan pembaruan indikator dalam satu requestAnimationFrame
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      paint();
      nav.classList.toggle('is-stuck', scrollY > 16);
      top.classList.toggle('is-show', scrollY > innerHeight);
      fadeArrow();
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  paint();
  nav.classList.toggle('is-stuck', scrollY > 16);
  fadeArrow();

  top.addEventListener('click', () => scrollTo({ top: 0, behavior: still() ? 'auto' : 'smooth' }));

  // 7. Buku tamu menggunakan localStorage
  const form = $('#guestForm');
  const list = $('#guestList');
  const msg  = $('#guestMsg');
  const empty = $('#guestEmpty');
  const KEY  = 'undangan.ucapan';

  const blank = (v) => !String(v ?? '').trim();

  const read = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(parsed) ? parsed.filter((g) => g && typeof g === 'object') : [];
    } catch { return []; }
  };

  const LABEL_HADIR = { ya: 'Hadir', tidak: 'Tidak hadir' };

  function render() {
    const data = read();
    list.replaceChildren(...data.map((g, i) => {
      const li = document.createElement('li');
      const name = document.createElement('b');
      name.textContent = g.nama;
      const phone = document.createElement('small');
      // 8. Menampilkan label kehadiran pada nomor telepon
      if (g.hadir) {
        const tag = document.createElement('em');
        tag.className = 'tamu__hadir' + (g.hadir === 'tidak' ? ' is-tidak' : '');
        tag.textContent = LABEL_HADIR[g.hadir] || g.hadir;
        phone.append(tag, g.hp);
      } else {
        phone.textContent = g.hp;
      }
      const text = document.createElement('p');
      text.textContent = g.ucapan;

      li.append(name, phone, text);
      return li;
    }));
    empty.hidden = data.length > 0;
  }



  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fields = $$('input:not([type="radio"]), textarea', form);
    let firstBad = null;
    fields.forEach((f) => {
      const bad = blank(f.value);
      f.classList.toggle('is-invalid', bad);
      if (bad && !firstBad) firstBad = f;
    });

    if (firstBad) {
      firstBad.focus();
      msg.classList.remove('is-ok');
      msg.textContent = 'Semua kolom perlu diisi.';
      return;
    }

    const data = read();
    data.unshift({
      nama: $('#gNama').value.trim(),
      hp: $('#gHp').value.trim(),
      hadir: form.elements.hadir.value,
      ucapan: $('#gUcapan').value.trim()
    });
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      msg.classList.remove('is-ok');
      msg.textContent = 'Penyimpanan penuh, ucapan tidak tersimpan.';
      return;
    }

    render();
    form.reset();
    msg.classList.add('is-ok');
    msg.textContent = 'Terima kasih, ucapan Anda tersimpan.';
  });

  render();

  // 11. Interaksi foto pengantin dan tampilan terpisah
  const splitStep = $('#pengantin');
  const splitWrap = $('#pengantinSplit');
  const coupleBtn = $('#pengantinCouple');

  const splitOn = () => {
    splitStep.classList.add('pengantin--split');
    splitWrap.hidden = false;
    coupleBtn.setAttribute('aria-expanded', 'true');
  };
  const splitOff = () => {
    splitStep.classList.remove('pengantin--split');
    splitWrap.hidden = true;
    coupleBtn.setAttribute('aria-expanded', 'false');
    splitWrap.querySelectorAll('.pengantin__person.is-open').forEach((person) => {
      person.classList.remove('is-open');
      person.querySelector('.pengantin__frame--person').setAttribute('aria-expanded', 'false');
    });
  };

  coupleBtn.addEventListener('click', splitOn);
  coupleBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); splitOn(); }
  });

  splitWrap.querySelectorAll('.pengantin__person').forEach((person) => {
    const frame = person.querySelector('.pengantin__frame--person');
    const toggle = (force) => {
      const open = typeof force === 'boolean' ? force : !person.classList.contains('is-open');
      person.classList.toggle('is-open', open);
      frame.setAttribute('aria-expanded', String(open));
    };
    person.addEventListener('click', () => toggle());
    frame.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggle(); }
    });
  });
  // 12. Mengabaikan scroll sesaat setelah membuka foto terpisah
  let arming = true;
  coupleBtn.addEventListener('click', () => { arming = true; setTimeout(() => { arming = false; }, 400); });
  addEventListener('scroll', () => {
    if (arming) return;
    if (splitStep.classList.contains('pengantin--split')) splitOff();
  }, { passive: true });

  // 13. Membuka section berdasarkan hash URL
  if (location.hash) {
    const deep = document.getElementById(location.hash.slice(1));
    if (deep) requestAnimationFrame(() => {
      deep.scrollIntoView({ behavior: 'auto', block: 'start' });
      paint();
    });
  }

  // 14. Countdown sampul
  const cdDays = $('#cdDays');
  const cdHours = $('#cdHours');
  const cdMinutes = $('#cdMinutes');
  const cdSeconds = $('#cdSeconds');
  const targetDate = new Date('2026-11-30T09:00:00+07:00').getTime();
  const pad2 = (n) => String(n).padStart(2, '0');
  const updateCountdown = () => {
    let diff = Math.max(0, targetDate - Date.now());
    const d = Math.floor(diff / 86400000); diff %= 86400000;
    const h = Math.floor(diff / 3600000); diff %= 3600000;
    const m = Math.floor(diff / 60000); diff %= 60000;
    const s = Math.floor(diff / 1000);
    cdDays.textContent = pad2(d);
    cdHours.textContent = pad2(h);
    cdMinutes.textContent = pad2(m);
    cdSeconds.textContent = pad2(s);
  };
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // 14. Self-test melalui parameter URL
  if (location.search.includes('selftest')) {
    const cases = [['', true], ['  ', true], [null, true], ['0', false], [' Muhammad ', false]];
    cases.forEach(([v, want], i) => {
      if (blank(v) !== want) console.error(`selftest kasus ${i + 1} gagal: ${JSON.stringify(v)}`);
    });
    console.log('selftest selesai');
  }
})();