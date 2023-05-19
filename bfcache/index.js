function printLog(msg) {
  var time = new Date().toLocaleTimeString();
  console.log(`${time}: ${msg}`)
}

window.addEventListener('pagehide', (event) => {
  if (event.persisted) {
    printLog('This page *might* be entering the bfcache.');
  } else {
    printLog('This page will unload normally and be discarded.');
  }
});

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    printLog('This page was restored from the bfcache.');
  } else {
    printLog('This page was loaded normally.');
  }
});
