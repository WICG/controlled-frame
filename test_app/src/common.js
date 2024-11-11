export function $(selector) {
  return document.querySelector(selector);
}

/**
 * Trusted Types Policy
 */
export const ttPolicy = trustedTypes.createPolicy('ttPolicy', {
  createScript: (s) => s,
  createScriptURL: (s) => {
    if (s.includes('http://localhost') || s.includes('127.0.0.1') ||
        s.charAt(0) === '/') {
      return s;
    }
    return '';
  },
  createHTML: s => s,
});

/**
 * Logging/Debugging Helpers
 */
function printLog(msg) {
  console.log(msg);
  $('#log').innerText = msg + '\n' + $('#log').innerText;
}

export const Log = {
  info: (msg) => printLog(`INFO: ${msg}`),
  evt: (msg) => printLog(`EVENT: ${msg}`),
  warn: (msg) => printLog(`WARNING: ${msg}`),
  err: (msg) => printLog(`ERROR: ${msg}`),
};

/**
 * Page Helpers
 */
export function toggleHide(elem) {
  elem.classList.toggle('hide');
}

export function textareaOninputHandler(e) {
  textareaExpand(e.target);
}

export function textareaExpand(el) {
  el.style.height = '';
  el.style.height = el.scrollHeight + 3 + 'px';
}
