// Side-effect script. ClientRouter re-executes this inline script on every
// client-side navigation, so global listeners are registered once (guarded by
// window.__stAnimInit) and per-page work runs on each astro:page-load.
(() => {
  if (window.__stAnimInit) return;
  window.__stAnimInit = true;

  // Element refs are refreshed on each page load (the DOM may be swapped)
  let nav = null;
  let mouseGlow = null;
  let observer = null;

  // 1. Navbar Scroll Effect
  const onScroll = () => {
    if (!nav) return;
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // 2. Mouse Glow Effect
  document.addEventListener('mousemove', (e) => {
    if (!mouseGlow) return;
    mouseGlow.style.opacity = '1';
    mouseGlow.style.left = e.clientX + 'px';
    mouseGlow.style.top = e.clientY + 'px';
  });

  document.addEventListener('mouseleave', () => {
    if (mouseGlow) mouseGlow.style.opacity = '0';
  });

  document.addEventListener('astro:page-load', () => {
    nav = document.querySelector('.glass-nav');
    mouseGlow = document.querySelector('.mouse-glow');

    // Apply immediately in case page loads scrolled
    onScroll();

    // 3. Intersection Observer for Scroll Animations
    if (observer) observer.disconnect();

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const pageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.style.getPropertyValue('--delay');
          if (delay) {
            entry.target.style.transitionDelay = delay;
          }
          entry.target.classList.add('active');
          pageObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);
    observer = pageObserver;

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => pageObserver.observe(el));

    // Contact form handling moved to src/scripts/contact-form.ts (real API submission)
  });
})();
