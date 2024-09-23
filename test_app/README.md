# Controlled Frame Test App

## Setup

This test app requires a binary of Chrome/Chromium that implements the
\<controlledframe\> tag in Isolated Web Apps (IWAs), such as a recent
Chrome Dev.

### Getting a copy of Chrome Dev

On your platform of choice, download
[Chrome Dev](https://www.google.com/chrome/dev/) and set an alias for the
executable path. Per-platform instructions:

#### MacOS

```sh
CHROME="/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev"
```

#### Windows

```sh
CHROME="C:\Program Files (x86)\Google\Chrome Dev\Application\chrome.exe"
```

#### Linux

```sh
CHROME="/opt/google/chrome-unstable/chrome"
```

## Run Chrome with the right flags

Some of the features you'll be trying are still under development and only
available with a particular configuration setting. Configure Chrome to prepare
for running the demo 'test_app' application.

1. Run the server script

```sh
python3 -m iwa_http_server.py
```

2. Execute Chrome with the following flags once.

```sh
$CHROME --enable-features=IsolatedWebApps,IsolatedWebAppDevMode,ControlledFrame
```

**Optional:** Use the `--user-data-dir` flag to install the IWA in a separate
Chrome profile. For example:

```sh
$CHROME --user-data-dir=$HOME/tmp \
        --enable-features=IsolatedWebApps,IsolatedWebAppDevMode,ControlledFrame
```

The user data directory can be cleared to start Chrome in a fresh profile.

3. Wait for Chrome to launch

## Install the demo application

Perform the steps below to run the demo app.

1. Navigate to chrome://web-app-internals, install the app at http://localhost:8000

2. Launch the Controlled Frame test app

In Chrome/Chromium, you should see the demo app in chrome://apps. Click on it
to launch the IWA.
