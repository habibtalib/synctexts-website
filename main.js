document.addEventListener('DOMContentLoaded', () => {
  // 1. Navbar Scroll Effect
  const nav = document.querySelector('.glass-nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

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

  // 4. Enhanced Form Handling
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button');
      const originalText = btn.innerHTML;
      const formWrapper = contactForm.closest('.contact-wrapper');
      
      // Loading state
      btn.disabled = true;
      btn.innerHTML = '<span class="loading-spinner"></span> Sending...';
      btn.style.opacity = '0.9';
      
      // Simulate API call
      setTimeout(() => {
        // Success state
        btn.innerHTML = '✓ Message Sent Successfully';
        btn.style.background = 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
        btn.style.opacity = '1';
        
        // Show success message in detail
        const successNotice = document.createElement('div');
        successNotice.className = 'success-message reveal active';
        successNotice.innerHTML = '<p>Thank you! Our engineers will review your request and get back to you within 24 hours.</p>';
        successNotice.style.marginTop = '2rem';
        successNotice.style.color = '#10b981';
        successNotice.style.textAlign = 'center';
        
        contactForm.style.display = 'none';
        contactForm.parentNode.appendChild(successNotice);
        
        // Optional: track with GA/GTM
        if (typeof gtag !== 'undefined') {
          gtag('event', 'form_submission', { 'event_category': 'contact' });
        }
      }, 1800);
    });
  }
});
