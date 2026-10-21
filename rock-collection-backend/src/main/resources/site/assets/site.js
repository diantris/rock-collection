// site.js - Small enhancements for the public site: index search / filter, and gallery arrows, dots and keys.
// Everything works without it: all cards are listed, and the gallery still swipes and scrolls.
(function () {
  'use strict';

  // ---- index: search and "unidentified only" -------------------------------------------------------------------
  var filters = document.querySelector('[data-filters]');
  if (filters) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
    var search = filters.querySelector('[data-filter-search]');
    var unidentified = filters.querySelector('[data-filter-unidentified]');
    var count = filters.querySelector('[data-filter-count]');
    var empty = document.querySelector('[data-filter-empty]');

    var apply = function () {
      var words = search.value.toLowerCase().split(/\s+/).filter(Boolean);
      var onlyUnidentified = unidentified && unidentified.getAttribute('aria-pressed') === 'true';
      var shown = 0;
      cards.forEach(function (card) {
        var text = card.getAttribute('data-search');
        var match = words.every(function (w) { return text.indexOf(w) !== -1; })
          && (!onlyUnidentified || card.getAttribute('data-unidentified') === 'true');
        card.hidden = !match;
        if (match) shown++;
      });
      count.textContent = shown === cards.length ? '' : 'Showing ' + shown + ' of ' + cards.length;
      empty.hidden = shown !== 0;
    };

    search.addEventListener('input', apply);
    if (unidentified) {
      unidentified.addEventListener('click', function () {
        unidentified.setAttribute('aria-pressed', unidentified.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        apply();
      });
    }
    filters.hidden = false;
  }

  // ---- specimen page: gallery ------------------------------------------------------------------------------------
  Array.prototype.forEach.call(document.querySelectorAll('[data-gallery]'), function (gallery) {
    var track = gallery.querySelector('[data-gallery-track]');
    var slides = track.children;
    var dots = gallery.querySelector('[data-gallery-dots]');
    var dotButtons = dots ? dots.querySelectorAll('button') : [];
    var expandButton = gallery.querySelector('[data-gallery-expand]');
    var closeButton = gallery.querySelector('[data-gallery-close]');
    var current = 0;

    var mark = function (index) {
      Array.prototype.forEach.call(dotButtons, function (b, i) {
        if (i === index) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
    };
    var show = function (index, instant) {
      current = (index + slides.length) % slides.length; // wraps around
      track.scrollTo({ left: current * track.clientWidth, behavior: instant ? 'auto' : 'smooth' });
      mark(current);
    };

    // Swiping or scrolling the track moves the dots along
    var timer;
    track.addEventListener('scroll', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        current = Math.round(track.scrollLeft / track.clientWidth);
        mark(current);
      }, 60);
    });

    if (slides.length > 1) {
      gallery.querySelector('[data-gallery-prev]').addEventListener('click', function () { show(current - 1); });
      gallery.querySelector('[data-gallery-next]').addEventListener('click', function () { show(current + 1); });
      Array.prototype.forEach.call(dotButtons, function (b, i) { b.addEventListener('click', function () { show(i); }); });
      Array.prototype.forEach.call(gallery.querySelectorAll('.gallery-arrow, [data-gallery-dots]'), function (el) { el.hidden = false; });
    }

    // Full screen: the same gallery, fixed over the page. It adds a history entry, so the browser's or phone's
    // Back button closes it (instead of leaving the page), and so do the close button and Escape.
    var fullScreen = false;
    var setFullScreen = function (on) {
      fullScreen = on;
      gallery.classList.toggle('is-fullscreen', on);
      document.documentElement.classList.toggle('viewer-open', on);
      expandButton.hidden = on;
      closeButton.hidden = !on;
      show(current, true); // the track changed size; stay on the same photo
      (on ? closeButton : expandButton).focus({ preventScroll: true });
    };
    var open = function () {
      if (fullScreen) return;
      history.pushState({ photoViewer: true }, '');
      setFullScreen(true);
    };
    var close = function () {
      if (fullScreen) history.back(); // popstate below does the closing
    };
    window.addEventListener('popstate', function () {
      if (fullScreen) setFullScreen(false);
    });
    expandButton.addEventListener('click', open);
    closeButton.addEventListener('click', close);
    track.addEventListener('click', function (e) {
      if (e.target.tagName === 'IMG') open();
    });

    gallery.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' && slides.length > 1) { e.preventDefault(); show(current - 1); }
      if (e.key === 'ArrowRight' && slides.length > 1) { e.preventDefault(); show(current + 1); }
      if (e.key === 'Escape' && fullScreen) { e.preventDefault(); close(); }
    });

    gallery.classList.add('gallery-enhanced');
    expandButton.hidden = false;
    mark(0);
  });
})();
