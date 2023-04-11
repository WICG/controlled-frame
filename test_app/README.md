# Controlled Frame Test App

## Setup

This test app requires a binary of Chrome/Chromium that implements the
\<controlledframe\> tag in Isolated Web Apps (IWAs), such as Chrome Canary
114.0.5708.0.

### Chrome Canary

Download
[Chrome Canary](https://www.google.com/chrome/canary/) and set an alias for the
executable path.

#### MacOS

```sh
CHROME="/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
```

#### Windows

```sh
CHROME="C:\Program Files (x86)\Google\Chrome SxS\Application\chrome.exe"
```

#### Linux

Chrome Canary is not available for Linux, so Chrome must be
[built](#build-chrome).

### Build Chrome

Follow the
[build instructions](https://www.chromium.org/developers/how-tos/get-the-code/).
Once Chrome is built, set an alias for the executable path.

```sh
CHROME="$HOME/chromium/src/out/Default/chrome"
```

## Run

Perform the steps below to run the test app.

1. Run the server script.

```sh
python3 -m iwa_http_server.py
```

2. Execute Chrome with the following flags once.

```sh
$CHROME --enable-features=IsolatedWebApps,IsolatedWebAppDevMode,IwaControlledFrame  \
        --install-isolated-web-app-from-url=http://localhost:8000
```

In Chrome/Chromium, you should see the test app in chrome://apps.

**Note:** On subsequent launches of Chrome, omit the
`--install-isolated-web-app-from-url` argument to avoid multiple test apps from
being installed.
