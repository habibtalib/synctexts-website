// Side-effect script: runs on every page load (including View Transitions)
document.addEventListener('astro:page-load', () => {
  // 1. Navbar Scroll Effect
  const nav = document.querySelector('.glass-nav');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 20) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    };
    // Apply immediately in case page loads scrolled
    onScroll();
    window.addEventListener('scroll', onScroll);
  }

  // 2. Mouse Glow Effect
  const mouseGlow = document.querySelector('.mouse-glow');
  if (mouseGlow) {
    document.addEventListener('mousemove', (e) => {
      mouseGlow.style.opacity = '1';
      mouseGlow.style.left = e.clientX + 'px';
      mouseGlow.style.top = e.clientY + 'px';
    });

    document.addEventListener('mouseleave', () => {
      mouseGlow.style.opacity = '0';
    });
  }

  // 3. Intersection Observer for Scroll Animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = entry.target.style.getPropertyValue('--delay');
        if (delay) {
          entry.target.style.transitionDelay = delay;
        }
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const revealElements = document.querySelectorAll('.reveal');
  revealElements.forEach((el) => observer.observe(el));

  // Contact form handling moved to src/scripts/contact-form.ts (real API submission)
});
