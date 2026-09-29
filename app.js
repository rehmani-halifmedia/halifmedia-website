/**
 * HALIF MEDIA — CORE INTERACTION LOGIC
 * Restrained, fast, and accessible
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollReveals();
  initScrollDynamics();
  initContactForm();
  initSmoothScroll();
  initServiceInteractions();
  initDynamicFavicon();
});

/**
 * Navigation Drawer Controls
 */
function initNavigation() {
  const menuToggleBtn = document.getElementById('menuToggleBtn');
  const menuCloseBtn = document.getElementById('menuCloseBtn');
  const menuOverlay = document.getElementById('menuOverlay');
  const menuDrawer = document.getElementById('menuDrawer');
  const drawerLinks = document.querySelectorAll('.drawer-nav-link');

  if (!menuToggleBtn || !menuDrawer) return;

  function openMenu() {
    menuDrawer.classList.add('active');
    menuOverlay.classList.add('active');
    menuToggleBtn.setAttribute('aria-expanded', 'true');
    menuDrawer.setAttribute('aria-hidden', 'false');
    menuOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    menuCloseBtn.focus();
  }

  function closeMenu() {
    menuDrawer.classList.remove('active');
    menuOverlay.classList.remove('active');
    menuToggleBtn.setAttribute('aria-expanded', 'false');
    menuDrawer.setAttribute('aria-hidden', 'true');
    menuOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    menuToggleBtn.focus();
  }

  menuToggleBtn.addEventListener('click', () => {
    const isOpen = menuDrawer.classList.contains('active');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (menuCloseBtn) {
    menuCloseBtn.addEventListener('click', closeMenu);
  }

  if (menuOverlay) {
    menuOverlay.addEventListener('click', closeMenu);
  }

  // Close when clicking any nav link
  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Keyboard escape key support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuDrawer.classList.contains('active')) {
      closeMenu();
    }
  });
}

/**
 * Intersection Observer for Quiet Scroll Reveals
 */
function initScrollReveals() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.12
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(el => observer.observe(el));
}

/**
 * Contact Form Handling & In-Place Confirmation
 * Integrates with Google Apps Script Web App
 */
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyA1rzRn6V7cup98bLw1WPP6VX7rUfBiCzBCJ_jq2BnEBZOncstpGekyR9x50atqfvK/exec'; // Replace with your published Google Apps Script Web App URL

function initContactForm() {
  const form = document.getElementById('contactForm');
  const confirmationState = document.getElementById('confirmationState');
  if (!form || !confirmationState) return;

  const nameInput = document.getElementById('userName');
  const emailInput = document.getElementById('userEmail');
  const messageInput = document.getElementById('userMessage');

  const nameError = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');
  const messageError = document.getElementById('messageError');
  const submitError = document.getElementById('submitError');
  const submitBtn = document.getElementById('submitBtn');

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showSuccessState() {
    form.style.transition = 'opacity 300ms ease, transform 300ms ease';
    form.style.opacity = '0';
    form.style.transform = 'translateY(-6px)';

    setTimeout(() => {
      form.style.display = 'none';
      confirmationState.style.display = 'flex';
      confirmationState.setAttribute('aria-hidden', 'false');
    }, 300);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = true;

    // Reset error messages
    [nameError, emailError, messageError].forEach(el => {
      if (el) {
        el.textContent = '';
        el.classList.remove('active');
      }
    });

    if (submitError) {
      submitError.style.display = 'none';
      submitError.textContent = '';
    }

    if (!nameInput.value.trim()) {
      if (nameError) {
        nameError.textContent = 'Please enter your name or company name.';
        nameError.classList.add('active');
      }
      isValid = false;
    }

    if (!emailInput.value.trim() || !validateEmail(emailInput.value.trim())) {
      if (emailError) {
        emailError.textContent = 'Please enter a valid email address.';
        emailError.classList.add('active');
      }
      isValid = false;
    }

    if (!messageInput.value.trim()) {
      if (messageError) {
        messageError.textContent = 'Please share a brief message.';
        messageError.classList.add('active');
      }
      isValid = false;
    }

    if (!isValid) return;

    // Visual feedback during dispatch
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';
      submitBtn.innerHTML = '<span>Sending...</span>';
    }

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      identity: 'Website Inquiry',
      message: messageInput.value.trim()
    };

    // If script URL is not yet configured, provide developer guidance
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE')) {
      console.warn('Google Apps Script URL is not configured yet. Set GOOGLE_SCRIPT_URL in app.js with your deployed Web App URL.');
      setTimeout(() => {
        showSuccessState();
      }, 500);
      return;
    }

    try {
      let isSuccess = false;

      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result && result.result === 'success') {
          isSuccess = true;
        } else {
          throw new Error(result?.message || 'Server error');
        }
      } catch (directErr) {
        console.warn('Direct JSON response error (often CORS redirect in Google Apps Script), retrying via safe dispatch mode:', directErr);
        // Fallback: Google Apps Script executes doPost even when browser blocks CORS reading
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });
        isSuccess = true;
      }

      if (isSuccess) {
        showSuccessState();
      }
    } catch (err) {
      console.error('Contact form submission failed:', err);
      if (submitError) {
        submitError.textContent = 'Unable to send your message right now. Please try again or reach out directly.';
        submitError.style.display = 'block';
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.innerHTML = '<span>Get in touch</span><span class="btn-arrow" aria-hidden="true">→</span>';
      }
    }
  });
}

/**
 * Smooth Scrolling
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/**
 * Editorial Service Index Interactions
 * Enables tactile hover and keyboard navigation across service rows
 */
function initServiceInteractions() {
  // Static editorial text presentation without hover state shifts
}

/**
 * Light, Meaningful Scroll Dynamics
 * 1. Razor-thin reading progress bar
 * 2. Gentle editorial parallax on hero master artwork
 */
function initScrollDynamics() {
  const progressBar = document.getElementById('scrollProgressBar');
  const heroArtwork = document.querySelector('.hero-founder-composition, .hero-artwork-composition');
  const heroSection = document.getElementById('hero');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let ticking = false;

  function updateScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

    // 1. Reading progress indicator
    if (progressBar && totalHeight > 0) {
      const progress = Math.min(100, Math.max(0, (scrollY / totalHeight) * 100));
      progressBar.style.width = `${progress}%`;
    }

    // 2. Subtle parallax drift on hero visual (only while hero is in view)
    if (!prefersReducedMotion && heroArtwork && heroSection) {
      const heroRect = heroSection.getBoundingClientRect();
      if (heroRect.bottom > 0) {
        const offset = Math.max(0, scrollY * 0.08);
        heroArtwork.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      }
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScroll);
      ticking = true;
    }
  }, { passive: true });

  // Initial call
  updateScroll();
}

/**
 * Adaptive Favicon Switcher
 * Automatically serves light/dark icon based on system/browser theme
 */
function initDynamicFavicon() {
  const lightIcon = 'assets/hm-icon-light.svg';
  const darkIcon = 'assets/hm-icon-dark.svg';
  const matcher = window.matchMedia('(prefers-color-scheme: dark)');

  function updateIcon(isDark) {
    const activeHref = isDark ? darkIcon : lightIcon;
    const links = document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]');
    links.forEach(link => {
      if (!link.getAttribute('media')) {
        link.href = activeHref;
      }
    });
  }

  if (matcher.addEventListener) {
    matcher.addEventListener('change', e => updateIcon(e.matches));
  } else if (matcher.addListener) {
    matcher.addListener(e => updateIcon(e.matches));
  }
  updateIcon(matcher.matches);
}

