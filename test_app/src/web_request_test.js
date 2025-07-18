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

  #addResult(result) {
    this.resultsDiv.innerText += result;
    this.resultsDiv.appendChild(document.createElement('br'));
    this.resultsDiv.appendChild(document.createElement('br'));
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
      this.#addResult('Success: Navigation to chromium was blocked.');
    } catch (e) {
      if (e.includes('chrome')) {
        this.resultsDiv.innerText +=
          'Failure: Navigation to chrome.com should have succeeded.';
      } else {
        this.resultsDiv.innerText +=
          'Failure: Navigation to chromium.org should have failed.';
      }
    }
  }

  async #onBeforeRequestCancelsNavigation() {
    const interceptor = this.controlledframe.request.createWebRequestInterceptor({
      resourceTypes: ['main-frame'],
      blocking: true,
      urlPatterns: ['https://www.chromium.org/*'],
    });
    const listener = (e) => { e.preventDefault() };
    interceptor.addEventListener('beforerequest', listener);
    await this.#expectNavigationToBeCanceled();
    interceptor.removeEventListener('beforerequest', listener);
  }

  async #onBeforeSendHeadersCancelsNavigation() {
    const interceptor = this.controlledframe.request.createWebRequestInterceptor({
      resourceTypes: ['main-frame'],
      blocking: true,
      urlPatterns: ['https://www.chromium.org/*'],
    });
    const listener = (e) => { e.preventDefault() };
    interceptor.addEventListener('beforesendheaders', listener);
    await this.#expectNavigationToBeCanceled();
    interceptor.removeEventListener('beforesendheaders', listener);
  }

  async #onHeadersReceivedCancelsNavigation() {
    const interceptor = this.controlledframe.request.createWebRequestInterceptor({
      blocking: true,
      resourceTypes: ['main-frame'],
      urlPatterns: ['https://www.chromium.org/*'],
    });
    const listener = (e) => { e.preventDefault() };
    interceptor.addEventListener('headersreceived', listener);
    await this.#expectNavigationToBeCanceled();
    interceptor.removeEventListener('headersreceived', listener);
  }

  async #onAuthRequiredFired() {
    const interceptor = this.controlledframe.request.createWebRequestInterceptor({
      resourceTypes: ['main-frame'],
      urlPatterns: ['https://authenticationtest.com/HTTPAuth/'],
      blocking: true,
    });
    const listener = (e) => {
      this.resultsDiv.innerText +=
        `Success: onAuthRequired event was fired; challenger is \
        ${e.response.auth.challenger.host}:${e.response.auth.challenger.port}`;
      e.preventDefault();
    };
    interceptor.addEventListener('authrequired', listener);
    try {
      await this.navigateFrame('https://authenticationtest.com/HTTPAuth/', /*shouldAbort=*/true);
    } catch (e) {
      if (this.resultsDiv.innerText.length === 0) {
        this.#addResult('Failure: onAuthRequired not fired');
      }
    }
    interceptor.removeEventListener('authrequired', listener);
  }

  async #onBeforeRedirectFired() {
    const interceptor = this.controlledframe.request.createWebRequestInterceptor({
      resourceTypes: ['main-frame'],
      urlPatterns: ['*://*:*'],
    });
    const listener = (e) => {
      this.#addResult(`Success: onBeforeRedirect fired for \
        redirect from ${e.request.url} to ${e.response.redirectURL}`);
    };
    interceptor.addEventListener('beforeredirect', listener);
    await this.navigateFrame('https://www.crrev.com/c/');
    interceptor.removeEventListener('beforeredirect', listener);
  }

  async #onCompletedFired() {
    const interceptor = this.controlledframe.request.createWebRequestInterceptor({
      resourceTypes: ['main-frame'],
      urlPatterns: ['*://*:*'],
    });
    const listener = (e) => {
      this.#addResult(`Success: onCompleted fired for \
        ${e.request.url} with status ${e.response.statusLine}`);
    };
    interceptor.addEventListener('completed', listener);
    await this.navigateFrame('https://www.chromium.org');
    interceptor.removeEventListener('completed', listener);
  }

  async #onErrorOccurredFired() {
    const interceptor = this.controlledframe.request.createWebRequestInterceptor({
      resourceTypes: ['main-frame'],
      urlPatterns: ['*://*:*'],
    });
    const listener = (e) => {
      this.#addResult(`Success: onErrorOccurred fired for \
        ${e.request.url} with error ${e.error}`);
    };
    interceptor.addEventListener('erroroccurred', listener);
    await this.navigateFrame('https://invalid-url');
    interceptor.removeEventListener('erroroccurred', listener);
  }

  async #onHeadersReceivedFired() {
    const interceptor = this.controlledframe.request.createWebRequestInterceptor({
      includeHeaders: 'all',
      resourceTypes: ['main-frame'],
      urlPatterns: ['*://*:*'],
    });
    const listener = (e) => {
      let headers = 'headers received: ';
      if (e.response.headers) {
        for (const header of e.response.headers) {
          headers += `${header[0]}: ${header[1]}; `;
        }
      } else {
        headers = 'no headers received';
      }
      this.#addResult(`Success: onHeadersReceived fired for \
        ${e.request.url} with ${headers}`);
    };
    interceptor.addEventListener('headersreceived', listener);
    await this.navigateFrame('https://www.google.com');
    interceptor.removeEventListener('headersreceived', listener);
  }

  async #onResponseStartedFired() {
    const interceptor = this.controlledframe.request.createWebRequestInterceptor({
      includeHeaders: 'all',
      resourceTypes: ['main-frame'],
      urlPatterns: ['*://*:*'],
    });
    const listner = (e) => {
      let headers = 'headers received: ';
      if (e.response.headers) {
        for (const header of e.response.headers) {
          headers += `${header[0]}: ${header[1]}; `;
        }
      } else {
        headers = 'no headers received';
      }
      this.#addResult(`Success: onResponseStarted fired for \
        ${e.request.url} with ${headers}`);
    };
    interceptor.addEventListener('responsestarted', listner);
    await this.navigateFrame('https://www.google.com');
    interceptor.removeEventListener('responsestarted', listner);
  }

  async #onSendHeadersFired() {
    const interceptor = this.controlledframe.request.createWebRequestInterceptor({
      blocking: true,
      includeHeaders: 'all',
      resourceTypes: ['main-frame'],
      urlPatterns: ['*://*:*'],
    });
    const setHeadersListener = (e) => {
      const modifiedHeaders = e.request.headers;
      modifiedHeaders.set('test', 'testValue');
      e.setRequestHeaders(modifiedHeaders);
    };
    interceptor.addEventListener('beforesendheaders', setHeadersListener);
    const getHeadersListener = (e) => {
      let headers = 'headers sent: ';
      if (e.request.headers) {
        for (const header of e.request.headers) {
          headers += `${header[0]}: ${header[1]}; `;
        }
      } else {
        headers = 'no headers sent';
      }
      if (e.request.headers && e.request.headers.get('test') === 'testValue') {
        this.#addResult(`Success: onSendHeaders fired for \
          ${e.request.url} with ${headers}`);
      } else {
        this.#addResult('Failure: custom header not sent');
      }
    };
    interceptor.addEventListener('sendheaders', getHeadersListener);
    await this.navigateFrame('https://www.google.com');
    interceptor.removeEventListener('sendheaders', getHeadersListener);
    interceptor.removeEventListener('beforesendheaders', setHeadersListener);
  }
};

customElements.define('web-request-test', WebRequestTest);
