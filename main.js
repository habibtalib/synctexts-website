document.addEventListener('DOMContentLoaded', () => {
  // 1. Navbar Scroll Effect
  const nav = document.querySelector('.glass-nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // 2. Intersection Observer for Scroll Animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // If element has a custom delay, apply it
        const delay = entry.target.style.getPropertyValue('--delay');
        if (delay) {
          entry.target.style.transitionDelay = delay;
        }
        entry.target.classList.add('active');
        // Optional: Stop observing once revealed
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const revealElements = document.querySelectorAll('.reveal');
  revealElements.forEach(el => observer.observe(el));

  // 3. Simple Form Handling
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button');
      const originalText = btn.innerText;
      
      btn.innerText = 'Sending...';
      btn.style.opacity = '0.7';
      
      // Simulate API call
      setTimeout(() => {
        btn.innerText = 'Message Sent!';
        btn.style.background = '#10b981'; // Success green
        btn.style.opacity = '1';
        contactForm.reset();
        
        // Reset button after 3 seconds
        setTimeout(() => {
          btn.innerText = originalText;
          btn.style.background = ''; // Reverts to CSS
        }, 3000);
      }, 1500);
    });
  }
});
