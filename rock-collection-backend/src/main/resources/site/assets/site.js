// site.js - Small enhancements for the public site: index search / filter / sort, gallery arrows, dots and keys, and the message box.
// Everything works without it: all cards are listed (in the owner's order), and the gallery still swipes and scrolls.
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

    // Sorting: the page lists the cards in the owner's order (featured first, then by name); the other orders are
    // the visitor's choice. Names compare numbers as numbers ("Agate 2" before "Agate 10").
    var list = document.querySelector('.cards');
    var sort = filters.querySelector('[data-sort]');
    var ownerOrder = cards.slice();
    var id = function (card) { return Number(card.getAttribute('data-id')); };
    var name = function (card) { return card.querySelector('.card-name').textContent; };
    var orders = {
      name: function (a, b) { return name(a).localeCompare(name(b), undefined, { numeric: true, sensitivity: 'base' }) || id(a) - id(b); },
      number: function (a, b) { return id(a) - id(b); },
      newest: function (a, b) { return id(b) - id(a); }
    };
    sort.addEventListener('change', function () {
      var sorted = orders[sort.value] ? ownerOrder.slice().sort(orders[sort.value]) : ownerOrder;
      sorted.forEach(function (card) { list.appendChild(card); });
    });
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

  // ---- specimen page: message box --------------------------------------------------------------------------------
  // Sends the message to the owner's Google Apps Script, which saves it in their Google Sheet. The script is on
  // another site, so its answer can't be read ("no-cors"); the request arriving is all that matters. Without JS the
  // box stays hidden (sending the form plainly would leave the visitor on a bare "ok" page).
  var messageForm = document.querySelector('[data-message]');
  if (messageForm && window.fetch && window.URLSearchParams && window.FormData) {
    var messageText = messageForm.querySelector('textarea');
    var messageCount = messageForm.querySelector('[data-message-count]');
    var messageStatus = document.querySelector('[data-message-status]');
    var sendButton = messageForm.querySelector('button[type="submit"]');
    var maxLength = messageText.getAttribute('maxlength');
    var countMessage = function () { messageCount.textContent = messageText.value.length + ' / ' + maxLength; };
    // This browser's messages about this stone; from the fourth one on, nothing is sent (the script has its own limits)
    var sentKey = 'rock-collection-sent-' + messageForm.elements.specimen.value;
    var sentBefore = function () {
      try { return Number(localStorage.getItem(sentKey)) || 0; } catch (err) { return 0; }
    };
    var finish = function (text) {
      messageForm.hidden = true;
      messageStatus.textContent = text;
      messageStatus.focus();
    };

    messageText.addEventListener('input', countMessage);
    messageForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!messageText.value.trim()) { messageText.focus(); return; }
      if (sentBefore() >= 3) {
        finish('Thank you, I’m still reviewing your previous messages about this stone.');
        return;
      }
      sendButton.disabled = true;
      sendButton.textContent = 'Sending…';
      messageStatus.textContent = '';
      fetch(messageForm.action, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(new FormData(messageForm)) })
        .then(function () {
          try { localStorage.setItem(sentKey, String(sentBefore() + 1)); } catch (err) { /* private mode: not counted */ }
          finish('Thank you! Your message has been sent.');
        }, function () {
          sendButton.disabled = false;
          sendButton.textContent = 'Send';
          messageStatus.textContent = 'Sorry, it couldn’t be sent. Please check your connection and try again.';
        });
    });
    countMessage();
    messageForm.hidden = false;
  }
})();
