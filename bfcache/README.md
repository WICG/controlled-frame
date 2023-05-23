# bfcache test app

This is a simple application to verify that bfcache is working
correctly. If you want to use it directly, start the server using:

* `python3 -m http.server 8001`

* Point your browser at `http://localhost:8001/`

* Open your developer tools console.

* Click back, click forward, then verify that the log contains messages
  confirming that the bfcache was used.
