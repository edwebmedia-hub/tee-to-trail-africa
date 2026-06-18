/* ============================================
   TEE TO TRAIL AFRICA — Global Scripts
   ============================================ */

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
    mobileNav.classList.toggle('open');
    toggle.classList.toggle('open');
  });
}

// Scroll reveal
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
reveals.forEach(el => observer.observe(el));

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

// Contact form submit
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'Message Sent ✓';
      contactForm.reset();
      setTimeout(() => { btn.textContent = 'Send Enquiry'; btn.disabled = false; }, 3000);
    }, 1200);
  });
}
