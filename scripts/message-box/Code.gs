/**
 * @OnlyCurrentDoc
 * Tells Google the script only needs the spreadsheet it belongs to, so it asks for access to that one, not to all of
 * the owner's spreadsheets. (The script runs as the owner; anyone who can edit the sheet can edit the script.)
 */

// Code.gs - Google Apps Script behind the public site's message box: each message becomes a row of the Google Sheet
// the script belongs to. Nothing is published or sent anywhere else. Set-up steps: scripts/README.md.
//
// The page posts specimen (the number), stone (its name), message and website (a hidden trap field only bots fill in).
// Every value from the page is untrusted, so it's checked again here: the length limit, links (removed unless they
// go to mindat.org), and text a spreadsheet would run as a formula.
//
// Against spam (Google doesn't tell the script who sent a message, so the limits go by what's already in the sheet):
// a message identical to one already saved for the same stone isn't saved again, and at most PER_STONE_PER_HOUR
// messages an hour are saved per stone and PER_HOUR in all. Dropped messages still get "ok". (The page itself also
// stops a visitor after their third message about a stone.)

/** Same limit as the page's box. */
const MAX_LENGTH = 300;
const PER_STONE_PER_HOUR = 5;
const PER_HOUR = 100;
/** How many of the latest rows are checked for repeats and counted for the limits. */
const RECENT_ROWS = 500;
/** The tab the messages go into; it's created, with a header row, by the first message. */
const SHEET_NAME = 'Messages';
const LINK_REMOVED = '[link removed]';

/** Links with a scheme ("https://…", "ftp://…") or starting with "www."; brackets and quotes end them. */
const SCHEME_LINK = /\b(?:[a-z][a-z0-9+.-]*:\/\/|www\.)[^\s<>"'()[\]{}]+/gi;
/**
 * Bare addresses ("example.com/page") on common top-level domains, leaving out ones that are also words ("it", "me",
 * "to"), so a missing space ("quartz.It") isn't taken for a link. Not right after "@", ".", "-" or a letter,
 * so email addresses (which people may leave for a reply) are kept.
 */
const BARE_LINK = /(?<![\w@.-])(?:[a-z0-9-]+\.)+(?:com|net|org|info|biz|io|ly|gl|gd|cc|tv|ws|ru|su|pl|de|uk|eu|ua|cn|br|fr|nl|cz|sk|xyz|top|site|online|shop|store|app|dev|link|click|club|tk|ml|ga|cf|gq|blog)\b(?:\/[^\s<>"'()[\]{}]*)?/gi;

/** Called for each message sent from the site. Always answers "ok", so bots learn nothing. */
function doPost(e) {
  const p = (e && e.parameter) || {};
  if (!p.website) {
    const message = cleanMessage(p.message);
    if (message) {
      const lock = LockService.getScriptLock();
      lock.waitLock(10000); // two messages at the same moment must not overwrite each other's row
      try {
        const sheet = messagesSheet();
        const now = new Date();
        const specimen = specimenNumber(p.specimen);
        if (shouldSave(sheet.getLastRow() < 2 ? [] : latestRows(sheet), specimen, message, now)) {
          sheet.appendRow([now, specimen, asText(plain(p.stone).slice(0, 200)), asText(message)]);
        }
      } finally {
        lock.releaseLock();
      }
    }
  }
  return ContentService.createTextOutput('ok');
}

/** The latest RECENT_ROWS messages as [received, specimen, stone, message], oldest first. */
function latestRows(sheet) {
  const last = sheet.getLastRow();
  const first = Math.max(2, last - RECENT_ROWS + 1); // row 1 is the header
  return sheet.getRange(first, 1, last - first + 1, 4).getValues();
}

/**
 * False for a repeat of a message already saved for this stone, or when this stone (or the whole site) already got
 * its limit of messages in the last hour.
 */
function shouldSave(rows, specimen, message, now) {
  const text = sameText(message);
  const hourAgo = now.getTime() - 60 * 60 * 1000;
  let lastHour = 0;
  let stoneLastHour = 0;
  for (const [received, number, , saved] of rows) {
    const sameStone = String(number) === String(specimen);
    if (sameStone && sameText(saved) === text) return false;
    if (received instanceof Date && received.getTime() > hourAgo) {
      lastHour++;
      if (sameStone) stoneLastHour++;
    }
  }
  return lastHour < PER_HOUR && stoneLastHour < PER_STONE_PER_HOUR;
}

/** Messages count as the same whatever their case and spacing. */
function sameText(value) {
  return String(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Opening the web app's address in a browser shows this, to check it's deployed. */
function doGet() {
  return ContentService.createTextOutput('The message box is working. Messages are saved in the "' + SHEET_NAME + '" tab.');
}

/** The message as it's saved: at most MAX_LENGTH characters, links removed unless they go to mindat.org. */
function cleanMessage(value) {
  const text = plain(value).slice(0, MAX_LENGTH);
  return text
    .replace(SCHEME_LINK, keepMindat)
    .replace(BARE_LINK, keepMindat)
    .trim();
}

/** Replacement for one link: the link itself if it goes to mindat.org over http(s), otherwise LINK_REMOVED. */
function keepMindat(link) {
  const trailing = /[.,;:!?]+$/.exec(link); // "see mindat.org/min-3337.html." keeps its full stop outside the link
  const end = trailing ? trailing[0] : '';
  const url = end ? link.slice(0, -end.length) : link;
  return (isMindat(url) ? url : LINK_REMOVED) + end;
}

function isMindat(url) {
  const scheme = /^([a-z][a-z0-9+.-]*):\/\//i.exec(url);
  if (scheme && !/^https?$/i.test(scheme[1])) return false;
  let host = url.slice(scheme ? scheme[0].length : 0).split(/[/?#\\]/)[0];
  host = host.slice(host.lastIndexOf('@') + 1).replace(/:\d*$/, '').replace(/\.$/, '').toLowerCase(); // drop "user@" and ":port"
  return host === 'mindat.org' || host.endsWith('.mindat.org');
}

/** Text without control characters (except line breaks), with Windows line breaks made plain, trimmed. */
function plain(value) {
  return String(value == null ? '' : value)
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ')
    .trim();
}

/** A specimen number, or empty when the page sent something else. */
function specimenNumber(value) {
  return /^\d{1,9}$/.test(String(value)) ? Number(value) : '';
}

/** Text starting with =, +, - or @ would run as a formula; a leading apostrophe makes the sheet keep it as text. */
function asText(text) {
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function messagesSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(['Received', 'Specimen', 'Stone', 'Message']);
    sheet.setFrozenRows(1);
    sheet.getRange('A1:D1').setFontWeight('bold');
    sheet.setColumnWidth(3, 180);
    sheet.setColumnWidth(4, 520);
    sheet.getRange('D:D').setWrap(true);
  }
  return sheet;
}
