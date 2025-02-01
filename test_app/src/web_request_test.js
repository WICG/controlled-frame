import { LitElement, css, html } from 'lit';

export class WebRequestTest extends LitElement {
  controlledframe;
  srcInput;
  resultsDiv;
  testNameToInfo = new Map();

  static styles = css`
    :host {
      width: 100%
      height: 100%;
    }

    .content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin: auto;
      width: 90%;
      min-width: 800;
      max-width: 1000;
    }

    .content > * {
      margin-top: 0.5em;
      margin-bottom: 0.5em;
    }

    .controlledframe {
      width: 400;
      height: 300;
    }

    #results {
      width: 80%;
      overflow-wrap: normal;
      overflow-y: auto;
    }
  `;

  // public functions
  // Returns a promise that resolves when the Controlled Frame is navigated to
  // src. If |shouldAbort| is true, then the promise is resolved if |loadabort|
  // is fired.
  navigateFrame(src, shouldAbort = false) {
    return new Promise((resolve, reject) => {
      this.controlledframe.addEventListener('loadcommit', function oncommit(details) {
        if (shouldAbort) {
          reject(details.url);
        } else {
          resolve(details.url);
        }
        this.controlledframe.removeEventListener('loadcommit', oncommit);
      }.bind(this));
      this.controlledframe.addEventListener('loadabort', function onabort(details) {
        if (shouldAbort) {
          resolve(details.url);
        } else {
          reject(details.url);
        }
        this.controlledframe.removeEventListener('loadabort', onabort);
      }.bind(this));
      this.controlledframe.src = src;
    });
  }

  runTest() {
    this.resultsDiv.innerText = '';
    this.testNameToInfo.get(this.#getActiveTest()).function();
  }

  // Lit inherited function overrides.
  connectedCallback() {
    super.connectedCallback();
    addEventListener('keydown', this.#handleKeydown.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.#handleKeydown);
  }

  constructor() {
    super();
    this.testNameToInfo.set(
      'foo',
      {
        description:
          'onBeforeRequest: Checks that onBeforeRequest is called',
        function: this.#onBeforeRequestFoo.bind(this)
      });
    this.testNameToInfo.set(
      'onBeforeRequestCancel',
      {
        description:
          'onBeforeRequest: Cancel navigation to https://www.chromium.org',
        function: this.#onBeforeRequestCancelsNavigation.bind(this)
      });
    this.testNameToInfo.set(
      'onBeforeSendHeadersCancel',
      {
        description:
          'onBeforeSendHeaders: Cancel navigation to https://www.chromium.org',
        function: this.#onBeforeSendHeadersCancelsNavigation.bind(this)
      });
    this.testNameToInfo.set(
      'onHeadersReceivedCancel',
      {
        description:
          'onHeadersReceived: Cancel navigation to https://www.chromium.org',
        function: this.#onHeadersReceivedCancelsNavigation.bind(this)
      });
    this.testNameToInfo.set(
      'onAuthRequiredFired',
      {
        description: 'onAuthRequired: Event is fired and cancelled',
        function: this.#onAuthRequiredFired.bind(this)
      });
    this.testNameToInfo.set(
      'onBeforeRedirectFired',
      {
        description: 'onBeforeRedirect: Event fired',
        function: this.#onBeforeRedirectFired.bind(this)
      });
    this.testNameToInfo.set(
      'onCompletedFired',
      {
        description: 'onCompleted: Event fired',
        function: this.#onCompletedFired.bind(this)
      });
    this.testNameToInfo.set(
      'onErrorOccurredFired',
      {
        description: 'onErrorOccurred: Event fired',
        function: this.#onErrorOccurredFired.bind(this)
      });
    this.testNameToInfo.set(
      'onHeadersReceivedFired',
      {
        description: 'onHeadersReceived: Event fired',
        function: this.#onHeadersReceivedFired.bind(this)
      });
    this.testNameToInfo.set(
      'onResponseStarted',
      {
        description: 'onResponseStarted: Event fired',
        function: this.#onResponseStartedFired.bind(this)
      });
    this.testNameToInfo.set(
      'onSendHeadersFired',
      {
        description: 'onSendHeaders: Event fired',
        function: this.#onSendHeadersFired.bind(this)
      });
  }

  render() {
    const tests = [];
    for (const [name, info] of this.testNameToInfo) {
      tests.push(html`<option value="${name}">${info.description}</option>`);
    }
    return html`
      <div class="content">
        <h1>Controlled Frame Web Request Test</h1>
        <div class="controlledframe">
          <controlledframe
              id="view" src="https://google.com" maxwidth="300" maxheight="300">
          </controlledframe>
        </div>
        <div id="tests">
          <label for="selectedTest">Web Request test</label>
          <select name="tests" id="selectedTest">${tests}</select>
          <button @click="${this.runTest}">Run Test</button>
        </div>
        <div id="results"></div>
      </div>
    `;
  }

  updated() {
    this.#getElements();

    this.controlledframe.addEventListener(
      'contentload', () => { console.log(`contentload fired`) });
    this.controlledframe.addEventListener('loadabort',
      details => { console.log(`loadabort fired for ${details.url}`) });
    this.controlledframe.addEventListener('loadcommit',
      details => { console.log(`loadcommit fired for ${details.url}`) });
    this.controlledframe.addEventListener('loadredirect',
      details => {
        console.log(`loadredirect fired for ${details.oldUrl} \
        to ${details.newUrl}`)
      });
    this.controlledframe.addEventListener('loadstart',
      details => { console.log(`loadstart fired for ${details.url}`) });
    this.controlledframe.addEventListener(
      'loadstop', () => { console.log(`loadstop fired`) });
  }

  // private functions
  #getElements() {
    this.controlledframe = this.renderRoot.getElementById('view');
    this.srcInput = this.renderRoot.getElementById('src');
    this.resultsDiv = this.renderRoot.getElementById('results');
    this.selectedTestSelect = this.renderRoot.getElementById('selectedTest');
  }

  #getActiveTest() {
    return this.selectedTestSelect.value;
  }

  #handleKeydown(event) {
    let selectOption = (index) => {
      const item = this.selectedTestSelect.options.item(index);
      if (item) {
        item.selected = 'selected';
      }
    }
    switch (event.code) {
      case 'Enter':
        this.runTest();
        break;
      case 'ArrowDown':
        const nextIndex = this.selectedTestSelect.selectedIndex + 1;
        selectOption(nextIndex);
        break;
      case 'ArrowUp':
        let prevIndex = this.selectedTestSelect.selectedIndex - 1;
        selectOption(prevIndex);
        break;
    }
  }

  // Tests
  async #expectNavigationToBeCanceled() {
    try {
      await this.navigateFrame('https://www.chrome.com');
      await this.navigateFrame('https://www.chromium.org', /*shouldAbort=*/true);
      this.resultsDiv.innerText = 'Success: Navigation to chromium was blocked.';
    } catch (e) {
      if (e.includes('chrome')) {
        this.resultsDiv.innerText =
          'Failure: Navigation to chrome.com should have succeeded.';
      } else {
        this.resultsDiv.innerText =
          'Failure: Navigation to chromium.org should have failed.';
      }
    }
  }

  async #onBeforeRequestFoo() {
    console.log('added listener');
    this.controlledframe.request.onBeforeRequest.addListener((details) => {
      console.log('onBeforeRequest', details);
      //return { cancel: true };
    }, { urls: ['<all_urls>'] }, ['blocking']);
    console.log('navigating frame');
    // await this.navigateFrame('https://www.chrome.com');
    console.log('calling fetch');
    await this.controlledframe.executeScript({code: `
        (async () => {
          console.log('running test');
          const img = document.createElement('img');
          img.src = 'https://developer.mozilla.org/static/media/mdn_contributor.14a24dcfda486f000754.png';
          img.setAttribute('crossorigin', '');
          document.body.appendChild(img);

          // fetch('https://mdn.org');
          // fetch('https://www.google.com');
          console.log('ran test');
        })();
      `});
    console.log('fetched');
    
  }

  async #onBeforeRequestCancelsNavigation() {
    this.controlledframe.request.onBeforeRequest.addListener(() => {
      console.log('onBeforeRequestCancelsNavigation');
      return { cancel: true, hello: 'world' };
    }, { urls: ['https://www.chromium.org/*'] }, ['blocking']);
    this.#expectNavigationToBeCanceled();
  }

  async #onBeforeSendHeadersCancelsNavigation() {
    this.controlledframe.request.onBeforeSendHeaders.addListener(() => {
      return { cancel: true };
    }, { urls: ['https://www.chromium.org/*'] }, ['blocking']);
    this.#expectNavigationToBeCanceled();
  }

  async #onHeadersReceivedCancelsNavigation() {
    this.controlledframe.request.onBeforeSendHeaders.addListener(() => {
      return { cancel: true };
    }, { urls: ['https://www.chromium.org/*'] }, ['blocking']);
    this.#expectNavigationToBeCanceled();
  }

  async #onAuthRequiredFired() {
    this.controlledframe.request.onAuthRequired.addListener((details) => {
      this.resultsDiv.innerText =
        `onAuthRequired event was fired; challenger is \
        ${details.challenger.host}:${details.challenger.port}`;
      return { cancel: true };
    }, { urls: ['https://www.w3.org/Member/'] }, ['blocking']);
    try {
      await this.navigateFrame('https://www.w3.org/Member/', /*shouldAbort=*/true);
    } catch (e) {
      if (this.resultsDiv.innerText.length === 0) {
        this.resultsDiv.innerText = 'Failure: onAuthRequired not fired';
      }
    }
  }

  #onBeforeRedirectFired() {
    this.controlledframe.request.onBeforeRedirect.addListener((details) => {
      this.resultsDiv.innerText += `Success: onBeforeRedirect fired for \
        redirect from ${details.url} to ${details.redirectUrl}`;
    }, { urls: ['<all_urls>'] });
    this.controlledframe.src = "https://www.crrev.com/c/";
  }

  #onCompletedFired() {
    this.controlledframe.request.onCompleted.addListener((details) => {
      this.resultsDiv.innerText += `Success: onCompleted fired for \
        ${details.url} with status ${details.statusLine}`;
    }, { urls: ['<all_urls>'] });
    this.controlledframe.src = "https://www.chromium.org";
  }

  #onErrorOccurredFired() {
    this.controlledframe.request.onErrorOccurred.addListener((details) => {
      this.resultsDiv.innerText += `Success: onErrorOccurred fired for \
        ${details.url} with error ${details.error}`;
    }, { urls: ['<all_urls>'] });
    this.controlledframe.src = "https://invalid-url";
  }

  #onHeadersReceivedFired() {
    this.controlledframe.request.onHeadersReceived.addListener((details) => {
      let headers = 'headers received: ';
      if (details.responseHeaders) {
        for (const header of details.responseHeaders) {
          headers += `${header.name}: ${header.value}; `;
        }
      } else {
        headers = 'no headers received';
      }
      this.resultsDiv.innerText += `Success: onHeadersReceived fired for \
        ${details.url} with ${headers}`;
    }, { urls: ['<all_urls>'] }, ['blocking']);
    this.controlledframe.src = 'https://www.google.com';
  }

  #onResponseStartedFired() {
    this.controlledframe.request.onResponseStarted.addListener((details) => {
      let headers = 'headers received: ';
      if (details.responseHeaders) {
        for (const header of details.responseHeaders) {
          headers += `${header.name}: ${header.value}; `;
        }
      } else {
        headers = 'no headers received';
      }
      this.resultsDiv.innerText += `Success: onResponseStarted fired for \
        ${details.url} with ${headers}`;
    }, { urls: ['<all_urls>'] });
    this.controlledframe.src = "https://www.google.com";
  }

  #onSendHeadersFired() {
    this.controlledframe.request.onBeforeSendHeaders.addListener(() => {
      return {
        responseHeaders: [{ name: 'test', value: 'testValue' }]
      };
    }, { urls: ['<all_urls>'] }, ['blocking']);
    this.controlledframe.request.onSendHeaders.addListener((details) => {
      let headers = 'headers received: ';
      if (details.responseHeaders) {
        for (const header of details.responseHeaders) {
          headers += `${header.name}: ${header.value}; `;
        }
      } else {
        headers = 'no headers received';
      }
      this.resultsDiv.innerText += `Success: onSendHeaders fired for \
        ${details.url} with ${headers}`;
    }, { urls: ['<all_urls>'] });
    this.controlledframe.src = "https://www.google.com";
  }
};

customElements.define('web-request-test', WebRequestTest);
