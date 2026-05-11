/* ═══════════════════════════════════════════════════════════════════════
   FACE 2 FACE — PRODUCTION JAVASCRIPT
   Handles: navbar scroll, mobile menu, smooth scroll, scroll animations
   ═══════════════════════════════════════════════════════════════════════ */

// ── Navbar scroll effect ───────────────────────────────────────────────
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const scroll = window.scrollY;
  if (scroll > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  lastScroll = scroll;
}, { passive: true });

// ── Mobile burger menu ─────────────────────────────────────────────────
const burger = document.getElementById('burger-btn');
const navLinks = document.getElementById('nav-links');

if (burger && navLinks) {
  burger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    // Animate burger to X
    const spans = burger.querySelectorAll('span');
    if (navLinks.classList.contains('open')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      const spans = burger.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    });
  });
}

// ── Active nav link tracking ───────────────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const allNavLinks = document.querySelectorAll('.navbar__link');

function updateActiveLink() {
  const scrollY = window.scrollY + 100;
  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    if (scrollY >= top && scrollY < top + height) {
      allNavLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + id) {
          link.classList.add('active');
        }
      });
    }
  });
}
window.addEventListener('scroll', updateActiveLink, { passive: true });

// ── Scroll-reveal animations ───────────────────────────────────────────
function initScrollAnimations() {
  // Add fade-in class to animatable elements
  const animTargets = document.querySelectorAll(
    '.steps-card, .feature-card, .safety-card, .testimonial-card, ' +
    '.feature-row__content, .feature-row__phone, ' +
    '.stats__item, .trust-stats__item, ' +
    '.download__content, .download__phones, ' +
    '.safety-hero'
  );

  animTargets.forEach((el, i) => {
    el.classList.add('fade-in');
    el.style.transitionDelay = `${Math.min(i % 4 * 80, 240)}ms`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px'
  });

  animTargets.forEach(el => observer.observe(el));
}

// ── Smooth counter animation for stats ────────────────────────────────
function animateCounters() {
  const statNumbers = document.querySelectorAll('.stats__number');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent;
        // Only animate numbers
        const match = text.match(/^([\d.]+)(.*)$/);
        if (match) {
          const target = parseFloat(match[1]);
          const suffix = match[2];
          const duration = 1500;
          const start = performance.now();

          function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            const current = target * eased;

            if (target >= 10) {
              el.textContent = Math.round(current) + suffix;
            } else {
              el.textContent = current.toFixed(1) + suffix;
            }

            if (progress < 1) {
              requestAnimationFrame(update);
            }
          }
          requestAnimationFrame(update);
        }
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => observer.observe(el));
}

// ── Floating particles ────────────────────────────────────────────────
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const count = 18;
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    const size = Math.random() * 3 + 1.5;
    dot.style.width = size + 'px';
    dot.style.height = size + 'px';
    dot.style.left = Math.random() * 100 + '%';
    dot.style.animationDuration = (Math.random() * 20 + 15) + 's';
    dot.style.animationDelay = (Math.random() * 20) + 's';
    container.appendChild(dot);
  }
}

// ── Hero scroll hint auto-hide ────────────────────────────────────────
function initScrollHint() {
  const hint = document.querySelector('.hero__scroll-hint');
  if (!hint) return;
  let hidden = false;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 200 && !hidden) {
      hint.style.opacity = '0';
      hint.style.transition = 'opacity 0.5s';
      hidden = true;
    } else if (window.scrollY <= 200 && hidden) {
      hint.style.opacity = '';
      hidden = false;
    }
  }, { passive: true });
}

// ── Parallax glow effect ──────────────────────────────────────────────
function initParallax() {
  const glows = document.querySelectorAll('.hero__glow');
  if (!glows.length) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    glows.forEach((glow, i) => {
      const speed = i === 0 ? 0.3 : 0.2;
      glow.style.transform = `translateY(${y * speed}px)`;
    });
  }, { passive: true });
}

// ── Init ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  animateCounters();
  updateActiveLink();
  initParticles();
  initScrollHint();
  initParallax();
});
