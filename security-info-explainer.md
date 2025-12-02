## Table of Contents [if the explainer is longer than one printed page]

<!-- Update this table of contents by running `npx doctoc README.md` -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Introduction](#introduction)
- [Goals](#goals)
- [Non-goals](#non-goals)
- [Use cases](#use-cases)
  - [Use case 1: Secure custom protocol for a server](#use-case-1-secure-custom-protocol-for-a-server)
- [Potential Solution](#potential-solution)
  - [Example usage for https](#example-usage-for-https)
  - [Example usage for web sockets](#example-usage-for-web-sockets)
  - [API Definitions](#api-definitions)
  - [How this solution would solve the use cases](#how-this-solution-would-solve-the-use-cases)
    - [Use case 1](#use-case-1)
- [Detailed design discussion](#detailed-design-discussion)
  - [Why attach `SecurityInfo` to the `onHeadersReceived` event?](#why-attach-securityinfo-to-the-onheadersreceived-event)
  - [Why require `securityInfo` and `securityInfoRawDer` options?](#why-require-securityinfo-and-securityinforawder-options)
- [Considered alternatives](#considered-alternatives)
  - [A new `verifyTLSServerCertificate` API for IWAs](#a-new-verifytlsservercertificate-api-for-iwas)
  - [Bundling root certificates with the app](#bundling-root-certificates-with-the-app)
  - [Modifying the `fetch` API](#modifying-the-fetch-api)
  - [Porting Firefox Extensions API `getSecurityInfo`](#porting-firefox-extensions-api-getsecurityinfo)
- [Security and Privacy Considerations](#security-and-privacy-considerations)
- [Compatibility with Extensions API](#compatibility-with-extensions-api)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Introduction

Web apps sometimes need to establish secure raw TCP/UDP connections (e.g., via [Direct Sockets](https://wicg.github.io/direct-sockets/)) for custom protocols, often to support legacy servers that cannot be updated to modern alternatives like WebTransport. Unlike standard HTTPS, these raw sockets don't have a built-in mechanism to verify the server's TLS certificate against a trusted root store.

This proposal introduces a `WebRequest SecurityInfo` API for [`ControlledFrame`](https://wicg.github.io/controlled-frame). It allows a web app to intercept an HTTPS, WSS or WebTransport request to a server, retrieve the server's certificate fingerprint (as verified by the browser), and then use that fingerprint to manually verify the certificate of a separate raw TCP/UDP connection to the same server. This provides a simple way for the app to confirm it's talking to the correct server.

## Goals

Enable isolated web apps to verify the trustworthiness of a server's (D)TLS certificate when establishing raw TCP/UDP connections via APIs like [Direct Sockets](https://wicg.github.io/direct-sockets/). This allows apps using custom (non web) protocols to ensure they are communicating with the correct, browser-trusted server, preventing man-in-the-middle (MITM) attacks.
Only in [Isolated Context](https://wicg.github.io/isolated-web-apps/isolated-contexts.html).

## Non-goals

* This API does **not** provide a general-purpose mechanism for web apps to verify arbitrary certificates against the browser's or OS's root store. The verification is limited to "pinning" a certificate fingerprint from a concurrent browser-verified connection.
* This API does **not** directly add (D)TLS capabilities to Direct Sockets. The app is still responsible for implementing the (D)TLS handshake (e.g., via a WASM-based library like OpenSSL).


## Use cases

### Use case 1: Secure custom protocol for a server
A web app needs to communicate with a server that uses a custom protocol over raw TCP. This server cannot be updated to use a modern, secure-by-default protocol like WebTransport. The web app bundles a (D)TLS library (compiled to WASM) to secure the connection using Direct Sockets. To prevent MITM attacks, the web app needs to verify that the server's (D)TLS certificate is the one it trusts. The server *also* serves a simple HTTPS status page from the same domain, using the same certificate. The web app needs a way to get the certificate details from the HTTPS connection to verify the TCP connection.
One of the reasons, why the server might need UDP is for better streaming performance, which is not possible to achieve via usual TCP.

## Potential Solution

We propose extending the `<controlledframe>` [`WebRequest`](https://wicg.github.io/controlled-frame/#api-web-request) API, which is available in Isolated Context. Specifically, we will add a new `securityInfo` field to the event object of the [`onHeadersReceived`](https://wicg.github.io/controlled-frame/#webrequestheadersreceivedevent) listener.

A web app will opt-in to receiving this information by setting true new dictionary members in the [`createWebRequestInterceptor`](https://wicg.github.io/controlled-frame/#dom-webrequest-createwebrequestinterceptor) options.

### Example usage for https

```javascript
// Global variable to a trusted certificate to be used later.
let trustedCert = undefined;

// html page must have <controlledframe id="cf">.
// src can be set as "about:blank".
const cf = document.querySelector('controlledframe');

// Set up https fetch interceptor.
const interceptor = cf.request.createWebRequestInterceptor({
    urlPatterns: ["*://*/*"],
    resourceTypes: ["xmlhttprequest"],
    securityInfoRawDer: true
});

// Save trusted certificate from intercepted request.
interceptor.addEventListener('headersreceived', (e) => {
    const securityInfo = e.securityInfo;

    if (securityInfo && securityInfo.state == "secure") {
        trustedCert = securityInfo.certificates[0].rawDER;
        console.log('obtained trusted certificate bytes' + trustedCert);
    }
});

// Execute https request.
cf.executeScript({
    code: `fetch('https://simple-push-demo.vercel.app/');`
});
```

### Example usage for web sockets

```javascript
// Global variable to a trusted certificate to be used later.
let trustedCert = undefined;

// html page must have <controlledframe id="cf">.
// src can be set as "about:blank".
const cf = document.querySelector('controlledframe');

// Set up wss fetch interceptor.
const interceptor = cf.request.createWebRequestInterceptor({
    // The urlPattern: ["*://*/*"] works for wss scheme only
    // from 142 version of Chrome.
    urlPatterns: ["wss://*/*"],
    resourceTypes: ["websocket"],
    securityInfoRawDer: true
});

// Save trusted certificate from intercepted request.
interceptor.addEventListener('headersreceived', (e) => {
    const securityInfo = e.securityInfo;

    if (securityInfo && securityInfo.state == "secure") {
        trustedCert = securityInfo.certificates[0].rawDER;
        console.log('obtained trusted certificate' + trustedCert);
    }
});

// Execute wss request.
cf.executeScript({
    code: `
        console.log('web socket is started.');
        const socket = new WebSocket('wss://echo.websocket.org/');
        
        socket.onopen = (event) => {
          console.log('✅ WebSocket connection established.');
          
          socket.close();
        };
      `
});
```

### API Definitions

The `securityInfo` object will be added to the `WebRequestHeadersReceivedEvent`:

```javascript
[Exposed=Window, IsolatedContext]
interface WebRequestHeadersReceivedEvent : WebRequestEvent {
  readonly attribute WebRequestResponse response;
  // New field.
  readonly attribute SecurityInfo? securityInfo;
};
```
The new dictionaries are defined as follows, closely matching the [Firefox extensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/SecurityInfo) for compatibility:

```javascript
[Exposed=Window, IsolatedContext]
dictionary SecurityInfo {
  required sequence<CertificateInfo> certificates;
  required ConnectionState state;
};
[Exposed=Window, IsolatedContext]
enum ConnectionState {
  "broken", "insecure", "secure" 
};
[Exposed=Window, IsolatedContext]
dictionary Fingerprint { 
  required DOMString sha256; 
};

[Exposed=Window, IsolatedContext]
dictionary CertificateInfo {
  required Fingerprint fingerprint;
  // Included only if securityInfoRawDer: true provided in WebRequestInterceptorOptions.
  Uint8Array rawDER;
};
```

And the new options for `createWebRequestInterceptor`:

```javascript
dictionary WebRequestInterceptorOptions {
  // ... existing options
  boolean securityInfo = false; 
  boolean securityInfoRawDer = false; 
};
```

* New `onHeadersReceivedOptions` are necessary for performance reasons. They specify whether ssl data must be kept for as long as the web request is alive. Without them, unnecessary data can be kept for longer. This is very undesirable especially in post quantum cryptography, since certificates can take a significant amount of memory space. 

* A new `securityInfo` object can be obtained in the `onHeadersReceived` event listener.

* To receive this information, a web app **must** include `"securityInfo=true"` or `"securityInfoRawDer=true"` when calling `createWebRequestInterceptor`. This opt-in design prevents performance overhead for the majority of extensions that don't need this data.

* The `securityInfo` object will only be populated for requests made over a secure protocol (e.g., HTTPS, WSS) where the TLS/QUIC handshake has successfully completed or also in case of certificate errors.
Browsers interrupt connections when there's a certificate error, unless user has explicitely allowed it in the browser UI, only in this case it is possible to have SecurityInfo with `state = "broken"`.

* `certificates` - will contain only the leaf server certificate. This is done for future extensibility and Firefox API compatibility, because Firefox API provides a leaf if [certificateChain](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/getSecurityInfo#certificatechain) is not included in getSecurityInfo options.

* `state` - State of the connection. One of:
    * `"broken"`: the TLS handshake failed (for example, the certificate has expired)
    * `"insecure"`: the connection is not a TLS connection
    * `"secure"`: the connection is a secure TLS connection
    * Note that Firefox extension API has a `“weak”` state of connection, which does not exist in Chrome.

* The `CertificateInfo.rawDER` field contains the raw certificate bytes in DER format, which can be parsed by the extension using a third-party library. This field is only provided if `WebRequestInterceptorOptions` includes `securityInfoRawDer=true`. The reason for it is a performance optimization to not pass raw bytes when it is not necessary, and compatibility with Firefox extensions API.


### How this solution would solve the use cases

#### Use case 1
The solution described in the code example above directly addresses the use case. A web app would:
1.  Use `<controlledframe>` to make a standard `fetch` (HTTPS) or `WebSocket` (WSS) connection to its server.
2.  Register a `webRequest` interceptor with `securityInfo: true` or `securityInfoRawDer: true`.
3.  In the `onHeadersReceived` listener, capture the `securityInfo.certificates[0].fingerprint.sha256` or `rawDER` from the browser-verified `secure` connection.
4.  Initiate its raw TCP/UDP connection via Direct Sockets.
5.  Perform its own (D)TLS handshake using a WASM-based library.
6.  During the handshake's certificate verification step, the app compares the fingerprint or full certificate provided by the server against the trusted data captured in step 3.
7.  If they match, the app trusts the connection. If not, it aborts.

## Detailed design discussion

### Why attach `SecurityInfo` to the `onHeadersReceived` event?
To support non-blocking web request model.

Another alternative, that was considered is [Firefox's extension API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/getSecurityInfo). It has a separate asynchronous function `getSecurityInfo(requestId)`. We chose to attach the data to the `onHeadersReceived` event to support non-blocking event-driven architecture (Manifest V3, which the extension version is based on).

In a non-blocking model, the internal network and certificate data associated with a request is often discarded immediately after the request pipeline advances. An asynchronous `getSecurityInfo()` call would be racy and unreliable. By requiring an opt-in (`securityInfo: true`) *before* the request, the browser knows to hold onto this data just long enough to deliver it with the `onHeadersReceived` event, ensuring data availability without blocking.

### Why require `securityInfo` and `securityInfoRawDer` options?
We introduced two separate boolean dictionary members, `securityInfo` and `securityInfoRawDer`, to minimize performance overhead.

1.  **`securityInfo`**: Calculating and retaining certificate information (even just a fingerprint) for every request would add overhead. This dictionary member ensures we only do this work for interceptors that actually need the data.
2.  **`securityInfoRawDer`**: Providing the raw DER-encoded certificate bytes (`rawDER`) is a further optimization. Many use cases (like fingerprint pinning) only need the `sha256` hash, which is small. Passing the full certificate bytes (which can be large, especially with post-quantum cryptography) is unnecessary unless the app explicitly requests it for parsing. This aligns with compatibility goals with the Firefox API.

## Considered alternatives

### A new `verifyTLSServerCertificate` API for IWAs
We considered adding a new API, similar to [`platformKeys.verifyTLSServerCertificate` deprecated extension APIs](https://developer.chrome.com/docs/extensions/mv2/reference/platformKeys#method-verifyTLSServerCertificate), that would verify a certificate against the browser's root store. However, this was rejected as it would mean using the Web PKI's Browser Root Store for non-web protocols, which is against security policy. The CRS is intended only for certs used for HTTPS, and using it for other protocols could slow the evolution of Web PKI security practices.

### Bundling root certificates with the app
The app could bundle its own set of trusted root CAs. This has significant drawbacks:
* **Maintenance:** The app developer is now responsible for tracking and updating the root store, which is a significant maintenance burden.
* **Revocation:** The app would have no way to perform revocation checks.
* **Restrictive Environments:** Apps in highly restricted firewall configurations might not be able to connect to external endpoints to update their bundled root store.

### Modifying the `fetch` API
We considered adding certificate access to the standard `fetch` API. This was deemed undesirable because `fetch` is a very general-purpose API available to the entire web. This `WebRequest SecurityInfo` feature is for the niche, high-privilege use case of Isolated Web Apps, and the `ControlledFrame` `webRequest` API is the appropriate, isolated surface for it. Furthermore, `fetch` only works for HTTPS, whereas `webRequest` also covers WebSockets (WSS) and WebTransport.

### Porting Firefox Extensions API `getSecurityInfo`
We considered porting [Firefox `getSecurityInfo`](https://developer.chrome.com/docs/extensions/mv2/reference/platformKeys#method-verifyTLSServerCertificate) extensions API, which is partially what happened, except that the current proposal adds non blocking compatible way to obtain `SecurityInfo`.

## Security and Privacy Considerations

This API exposes the server's leaf certificate and fingerprint to the web app. This is not considered a new security or privacy risk.

A web app with Isolated Context and the `direct-sockets` permission can already open a raw TCP connection to any server, perform a (D)TLS handshake using a WASM library, and retrieve the *exact same* server certificate.

This proposal simply makes the process more reliable by allowing the app to get the *browser-verified* certificate information, rather than one from a separate, (potentially) different connection. It does not expose any new information that a privileged web app couldn't already obtain. The API is restricted to `IsolatedContext` environments and is not available to the general web.

## Compatibility with Extensions API

`WebRequest SecurityInfo` will also be implemented for [Extensions API in Chrome](https://github.com/w3c/webextensions/pull/899), whereas in Firefox it [already exists](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/getSecurityInfo).
The reason for keeping Extension API aligned with Isolated Context Web API:

* To reduce maintenance burden, since internally the same code is responsible for both API.
* Developer ergonomics: authors can easily reuse the API in different contexts, without having to learn an entirely new one.