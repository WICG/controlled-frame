# Controlled Frame Test App

## Setup

This test app requires a binary of Chrome/Chromium that implements the
\<controlledframe\> tag in Isolated Web Apps (IWAs), such as Chrome Dev
114.0.5714.0.

### Chrome Dev

Download
[Chrome Dev](https://www.google.com/chrome/dev/) and set an alias for the
executable path.

#### MacOS

```sh
CHROME="/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev"
```

#### Windows

```sh
CHROME="C:\Program Files (x86)\Google\Chrome Dev\Application\chrome.exe"
```

#### Linux

Chrome Dev on Linux does not currently have Controlled Frame implemented yet,
, so Chrome must be [built](#build-chrome).

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
