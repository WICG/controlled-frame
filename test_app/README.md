# Controlled Frame Test App

## Setup

This test app requires a binary of Chrome/Chromium that implements the
\<controlledframe\> tag in Isolated Web Apps (IWAs), such as a recent
Chrome Dev.

### Getting a copy of Chrome Dev

On your platform of choice, download
[Chrome Dev](https://www.google.com/chrome/dev/).

## Run Chrome with the right flags

Some of the features you'll be trying are still under development and only
available with a particular configuration setting. Configure Chrome to prepare
for running the demo 'test_app' application.

Navigate to chrome://flags, and enable the following Experiments:
  1. enable-isolated-web-apps
  1. enable-isolated-web-app-dev-mode
  1. enable-controlled-frame

## Install the demo application
### Pre-built

Navigate to chrome://web-app-internals, and enter the following URL into the
"Install IWA from Update Manifest" field:
```
https://github.com/WICG/controlled-frame/releases/latest/download/controlled-frame-test-app-update.json
```

Alternatively, download the latest release
[here](https://github.com/WICG/controlled-frame/releases/latest/download/controlled-frame-test-app.swbn).
Navigate to chrome://web-app-internals, click the button next to the "Install IWA from Signed Web Bundle"
label, and select the downloaded swbn file.

### From source
1. Install JS dependencies

```sh
pnpm install
```

2. Run the server

```sh
pnpm run dev
```

3. Navigate to chrome://web-app-internals, and enter the following URL into the
"Install IWA via Dev Mode Proxy" field:
```
http://localhost:5193
```

4. Launch the Controlled Frame test app

In Chrome/Chromium, you should see the demo app in chrome://apps. Click on it
to launch the IWA.
