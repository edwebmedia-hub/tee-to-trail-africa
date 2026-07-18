/* ============================================
   TEE TO TRAIL AFRICA — Global Scripts
   ============================================ */

// Signal JS is active so CSS can safely apply the hidden .reveal state.
document.documentElement.classList.add('js');

// Region nav — active link tracking
(function () {
  const regionLinks = document.querySelectorAll('.region-nav-link[data-region]');
  if (!regionLinks.length) return;
  const regions = Array.from(regionLinks).map(l => document.getElementById(l.dataset.region)).filter(Boolean);
  function updateActive() {
    let current = regions[0];
    regions.forEach(r => { if (window.scrollY >= r.offsetTop - 160) current = r; });
    regionLinks.forEach(l => l.classList.toggle('is-active', l.dataset.region === current.id));
  }
  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();
})();

// Nav scroll behaviour
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    const isScrolled = window.scrollY > 60;
    nav.classList.toggle('scrolled', isScrolled);
    nav.classList.toggle('transparent', !isScrolled);
  });
}

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const mobileNav = document.querySelector('.nav-mobile');
if (toggle && mobileNav) {
  toggle.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    toggle.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

// Scroll reveal — guarded so content is never left permanently invisible.
// Reduced motion shows everything; otherwise IntersectionObserver animates,
// backed by a scroll-driven in-view check that works even where IO is flaky
// (e.g. some in-app webviews) so nothing can get stranded at opacity:0.
(function () {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;
  const reveal = el => el.classList.add('visible');

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveals.forEach(reveal);
    return;
  }

  // Reliable fallback: reveal any element once it enters the viewport.
  let ticking = false;
  const checkInView = () => {
    ticking = false;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    reveals.forEach(el => {
      if (!el.classList.contains('visible') && el.getBoundingClientRect().top < vh - 40) reveal(el);
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(checkInView); } };

  // Primary: IntersectionObserver (performant) when available.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => { if (e.isIntersecting) { reveal(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(el => observer.observe(el));
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  checkInView();               // reveal whatever is already in view on load
  setTimeout(checkInView, 1200); // catch late layout shifts / stalled IO
})();

// FAQ accordion
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    // close all in same group
    item.closest('.faq-list').querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// FAQ tabs
document.querySelectorAll('.faq-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.faq-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.faq-group').forEach(g => g.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.target).classList.add('active');
  });
});

// Active nav link
const currentPage = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(link => {
  if (link.getAttribute('href') === currentPage) link.classList.add('active');
});

// Tour type card selection + destination reveal
(function () {
  const radios = document.querySelectorAll('.tour-type-card input[type="radio"]');
  const destReveal = document.getElementById('destReveal');
  const destLocal  = document.getElementById('destLocal');
  const destIntl   = document.getElementById('destIntl');
  if (!radios.length || !destReveal) return;

  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      // highlight selected card
      document.querySelectorAll('.tour-type-card').forEach(c => c.classList.remove('is-selected'));
      radio.closest('.tour-type-card').classList.add('is-selected');

      const val = radio.value;
      const showLocal = val === 'Local South Africa' || val === 'Combined SA + International';
      const showIntl  = val === 'International'      || val === 'Combined SA + International';

      destLocal.style.display = showLocal ? 'block' : 'none';
      destIntl.style.display  = showIntl  ? 'block' : 'none';

      destReveal.classList.add('is-open');
    });
  });
})();

// Region accordion — expand courses when region checkbox is ticked
document.querySelectorAll('.region-toggle').forEach(cb => {
  cb.addEventListener('change', () => {
    const item = cb.closest('.region-acc-item');
    if (cb.checked) {
      item.classList.add('is-open');
    } else {
      item.classList.remove('is-open');
      item.querySelectorAll('.course-check input').forEach(c => c.checked = false);
    }
  });
});

// Contact form submit
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled = true;

    const fd = new FormData(contactForm);
    const courses = [...contactForm.querySelectorAll('input[name="course"]:checked')].map(c => c.value);

    const payload = {
      firstName:     fd.get('firstName'),
      lastName:      fd.get('lastName'),
      email:         fd.get('email'),
      phone:         fd.get('phone'),
      tourType:      fd.get('tourType'),
      courses,
      groupSize:     fd.get('groupSize'),
      duration:      fd.get('duration'),
      dates:         fd.get('dates'),
      budget:        fd.get('budget'),
      accommodation: fd.get('accommodation'),
      transport:     fd.get('transport'),
      message:       fd.get('message'),
    };

    try {
      const res  = await fetch('/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        btn.textContent = 'Message Sent ✓';
        contactForm.reset();
        setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 4000);
      } else {
        alert(data.message);
        btn.textContent = originalText;
        btn.disabled = false;
      }
    } catch {
      alert('Something went wrong. Please email us directly at info@teetotrailafrica.com');
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}
