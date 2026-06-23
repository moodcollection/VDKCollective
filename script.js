  (function () {
    'use strict';

    /* LOGO INJECTION
       The base64 data URI is written once to window._VDK by a
       <script> block in index.html, then applied to every logo
       image here — keeping it out of the HTML file payload. */
  

    /* ============================================================
       MOBILE NAVIGATION
       ============================================================ */
    var navToggle = document.getElementById('navToggle');
    var mobileNav = document.getElementById('mobileNav');
    var scrim = document.createElement('div');
    scrim.className = 'nav-scrim';
    document.body.appendChild(scrim);

    function openNav() {
      mobileNav.classList.add('is-open');
      scrim.classList.add('is-open');
      navToggle.setAttribute('aria-expanded', 'true');
      mobileNav.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeNav() {
      mobileNav.classList.remove('is-open');
      scrim.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    navToggle.addEventListener('click', function () {
      mobileNav.classList.contains('is-open') ? closeNav() : openNav();
    });
    scrim.addEventListener('click', closeNav);
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    /* ============================================================
       STICKY HEADER STYLE ON SCROLL
       ============================================================ */
    var header = document.getElementById('siteHeader');
    function handleHeaderScroll() {
      if (window.scrollY > 12) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }
    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    handleHeaderScroll();

    /* ============================================================
       SMOOTH SCROLL (anchor links)
       ============================================================ */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var targetId = anchor.getAttribute('href').slice(1);
        var target = document.getElementById(targetId);
        if (!target) return;
        e.preventDefault();
        var headerHeight = header.offsetHeight;
        var top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });

    /* ============================================================
       SCROLL REVEAL ANIMATIONS
       ============================================================ */
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

      revealEls.forEach(function (el) { revealObserver.observe(el); });

      var chartWrap = document.querySelector('.chart-wrap');
      if (chartWrap) {
        var chartObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              chartObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.3 });
        chartObserver.observe(chartWrap);
      }
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }

    /* ============================================================
       BACK TO TOP
       ============================================================ */
    var backToTop = document.getElementById('backToTop');
    function handleBackToTop() {
      if (window.scrollY > 600) {
        backToTop.hidden = false;
        requestAnimationFrame(function () { backToTop.classList.add('is-visible'); });
      } else {
        backToTop.classList.remove('is-visible');
      }
    }
    window.addEventListener('scroll', handleBackToTop, { passive: true });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* ============================================================
       FOOTER YEAR
       ============================================================ */
    var footerYear = document.getElementById('footerYear');
    if (footerYear) footerYear.textContent = new Date().getFullYear();

    /* ============================================================
       CONTACT FORM — VALIDATION + SUBMISSION
       ============================================================ */
    var form = document.getElementById('enquiryForm');
    var submitBtn = document.getElementById('submitBtn');
    var successMessage = document.getElementById('successMessage');

    var fieldRules = {
      fullName: {
        validate: function (v) { return v.trim().length >= 2; },
        message: 'Please enter your full name.'
      },
      email: {
        validate: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
        message: 'Please enter a valid email address.'
      },
      phone: {
        validate: function (v) { return v.replace(/[^\d]/g, '').length >= 7; },
        message: 'Please enter a valid phone number.'
      },
      businessName: {
        validate: function (v) { return v.trim().length >= 2; },
        message: 'Please enter your business name.'
      }
    };

    function setFieldError(name, message) {
      var input = document.getElementById(name);
      var errorEl = document.getElementById('err-' + name);
      if (input) input.classList.toggle('has-error', !!message);
      if (errorEl) errorEl.textContent = message || '';
    }

    function clearAllErrors() {
      Object.keys(fieldRules).forEach(function (name) { setFieldError(name, ''); });
      setFieldError('general', '');
    }

    function validateField(name) {
      var input = document.getElementById(name);
      var rule = fieldRules[name];
      if (!input || !rule) return true;
      var isValid = rule.validate(input.value);
      setFieldError(name, isValid ? '' : rule.message);
      return isValid;
    }

    Object.keys(fieldRules).forEach(function (name) {
      var input = document.getElementById(name);
      if (!input) return;
      input.addEventListener('blur', function () { validateField(name); });
      input.addEventListener('input', function () {
        if (input.classList.contains('has-error')) validateField(name);
      });
    });

    function setLoading(isLoading) {
      submitBtn.classList.toggle('is-loading', isLoading);
      submitBtn.disabled = isLoading;
    }

    function getFormData() {
      return {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        businessName: document.getElementById('businessName').value,
        website: document.getElementById('website').value,
        industry: document.getElementById('industry').value,
        details: document.getElementById('details').value
      };
    }

    function onSubmitSuccess(response) {
      setLoading(false);

      if (response && response.success) {
        form.hidden = true;
        successMessage.hidden = false;
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // ------------------------------------------------------------
        // FUTURE: CALENDLY INTEGRATION
        // Once a booking link is live, this is where to redirect or
        // embed the scheduler instead of (or alongside) the static
        // success message above, e.g.:
        //   window.location.href = 'https://calendly.com/your-link';
        // ------------------------------------------------------------
        return;
      }

      if (response && response.errors) {
        if (response.errors.general) {
          setFieldError('general', response.errors.general);
        }
        Object.keys(response.errors).forEach(function (key) {
          if (key !== 'general') setFieldError(key, response.errors[key]);
        });
      }
    }

    function onSubmitFailure(error) {
      setLoading(false);
      setFieldError('general', 'Something went wrong. Please try again or email us directly at vdkcollective@outlook.com.');
      console.error(error);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearAllErrors();

      var isFormValid = true;
      Object.keys(fieldRules).forEach(function (name) {
        if (!validateField(name)) isFormValid = false;
      });

      if (!isFormValid) {
        var firstError = form.querySelector('.has-error');
        if (firstError) firstError.focus();
        return;
      }

      setLoading(true);

      var formData = getFormData();

      // ------------------------------------------------------------
      // NETLIFY MIGRATION NOTE
      // When this site moves to Netlify, replace the google.script.run
      // block below with, e.g.:
      //
      //   fetch('/', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      //     body: new URLSearchParams({ 'form-name': 'enquiry', ...formData }).toString()
      //   }).then(() => onSubmitSuccess({ success: true }))
      //     .catch(onSubmitFailure);
      //
      // formData is already shaped to drop straight into that payload.
      // ------------------------------------------------------------
      if (window.google && window.google.script && window.google.script.run) {
        google.script.run
          .withSuccessHandler(onSubmitSuccess)
          .withFailureHandler(onSubmitFailure)
          .submitEnquiry(formData);
      } else {
        // Local preview fallback (no Apps Script backend available)
        setTimeout(function () {
          onSubmitSuccess({
            success: true,
            message: 'Thank you for contacting VDK Collective. A member of our team will be in touch shortly.'
          });
        }, 600);
      }
    });

  })();
