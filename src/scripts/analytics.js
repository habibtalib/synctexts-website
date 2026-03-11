// Analytics event tracking for GTM/GA4
// Virtual pageviews for View Transitions + CTA click tracking

// Virtual pageview tracking for View Transitions
document.addEventListener('astro:page-load', () => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'page_view',
    page_path: window.location.pathname,
    page_title: document.title,
  });
});

// CTA button click tracking
document.addEventListener('astro:page-load', () => {
  document.querySelectorAll('a.btn, .cta-button, [data-cta]').forEach((el) => {
    el.addEventListener('click', () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'cta_click',
        cta_text: el.textContent?.trim(),
        cta_location: el.closest('section')?.id || 'unknown',
      });
    });
  });
});
