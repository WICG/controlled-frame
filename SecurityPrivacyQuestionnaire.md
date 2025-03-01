## [2.1 What information does this feature expose, and for what purposes?](https://www.w3.org/TR/security-privacy-questionnaire/#purpose)

Controlled Frame allows an [isolated
context](https://wicg.github.io/isolated-web-apps/isolated-contexts.html) to
embed a third-party origin in an embedding control. The embedder can interact
with the embedding control to inspect, access, control, and manage the embedded
content.

This control is used to satisfy the use cases outlined in the specification
document, which include supporting virtualized desktop uses and kiosk needs,
among others.

## [2.2 Do features in your specification expose the minimum amount of information necessary to implement the intended functionality?](https://www.w3.org/TR/security-privacy-questionnaire/#minimum-data)

Yes, we intentionally expose the embedding control and specifically it is only
available to [isolated
contexts](https://wicg.github.io/isolated-web-apps/isolated-contexts.html).

Controlled Frame is not available unless its corresponding "controlled-frame"
permissions policy which is managed via the IWA high water permissions
"permissions_policy" manifest entry.

## [2.3 Do the features in your specification expose personal information, personally-identifiable information (PII), or information derived from either?](https://www.w3.org/TR/security-privacy-questionnaire/#personal-data)

The features in this specification do not expose PII directly of the user.
Controlled Frames are only available in [isolated
contexts](https://wicg.github.io/isolated-web-apps/isolated-contexts.html) which
require that functionality running in the isolated context store its data in
a separate storage partition from the default storage partition.

The purpose of the Controlled Frame API is to allow an embedder to control the
third-party origin's embedding control. By allowing the embedder control over
this instance, the [use
cases](https://wicg.github.io/controlled-frame/#motivating-applications) can be
satisfied which possibly could expose all data within the embedding control
(including PII) in a specific controlled environment.

## [2.4 How do the features in your specification deal with sensitive information?](https://www.w3.org/TR/security-privacy-questionnaire/#sensitive-data)

Controlled Frame is only available to [isolated
contexts](https://wicg.github.io/isolated-web-apps/isolated-contexts.html) and
is not available outside of isolated contexts. In addition, the Controlled Frame
API is only available if the "controlled-frame" permissions policy is requested
and granted by the user agent's IWA environment.

If Controlled Frame's requirements are met and it's available, the specification's
API surface will be available. Each method is responsibly designed to handle just
the data, identifiers, and arguments that it requires.

## [2.5 Does data exposed by your specification carry related but distinct information that may not be obvious to users?](https://www.w3.org/TR/security-privacy-questionnaire/#hidden-data)

Controlled Frame is only available to [isolated
contexts](https://wicg.github.io/isolated-web-apps/isolated-contexts.html). In
Chrome, isolated contexts are usually only available to IWAs.

IWAs support all of the APIs available to the web, similar to PWAs. IWAs require
that any permission required to be granted by the user agent must be specified
in the high watermark permission manifest's "permissions_policy".

As for the Controlled Frame API, specifically, as an embedding control, it is
possible to use it in multiple ways where interaction with the API could expose
distinct information that may not be obvious to users.

Examples of how data could be exposed that may not be obvious to users:

* If the Controlled Frame is used similar to &lt;iframe&gt;, all concerns
about how an &lt;iframe&gt; may obfuscate the origin source apply to Controlled
Frame. The IWA will need to take care to ensure that users understand the source
of the embedded content before interacting with it.

* If users interact with embedded content within a Controlled Frame, the
embedder could exfiltrate that interaction via JavaScript.

* An embedder could interact with embedded content and use APIs that carry
some associated exposure risk.

## [2.6 Do the features in your specification introduce state that persists across browsing sessions?](https://www.w3.org/TR/security-privacy-questionnaire/#persistent-origin-specific-state)

Controlled Frame is only available to [isolated
contexts](https://wicg.github.io/isolated-web-apps/isolated-contexts.html).

The methods in the specification currently do not store state that perists
across browsing sessions. As an embedding control, though, Controlled Frame
allows state to be stored across browsing sessions for any origin that is loaded
within it.

This is a key reason why Controlled Frame is only available to isolated
contexts.  Isolated contexts store their data in a separate storage partition
from the default storage partition used in normal web browsing. While the IWA
embedder will store any data it has in its isolated storage partition, a
Controlled Frame will have a separate storage partition that is apart from the
isolated storage partition in order to store the Controlled Frame embedded
content's data.

Controlled Frame by default should use an in-memory storage partition that does
not persist user data beyond when the Controlled Frame instance needs access to
it.  The embedder may adjust the `partition` attribute to contain the "persist:"
prefix, which will signal to the user agent to place the Controlled Frame
storage partition in a location where it will persist, such as on disk.

## [2.7 Do the features in your specification expose information about the underlying platform to origins?](https://www.w3.org/TR/security-privacy-questionnaire/#underlying-platform-data)

While an embedder has a Controlled Frame instance, it's possible that through
interacting with the instance using its methods or events, information about the
underlying platform could be exposed. This exposure could be either purposefully
or accidentally due to, for example, the types of functionality available, such
as JavaScript execution.

## [2.8 Does this specification allow an origin to send data to the underlying platform?](https://www.w3.org/TR/security-privacy-questionnaire/#send-to-platform)

Controlled Frame does not provide a means of communicating with the underlying
platform.

Embedded content may use a separate feature such as an IWA API or a regular web
API that allows sending data to the underlying platform. Through that mechanism,
it would then be possible for an IWA to interact with the underlying platform.

## [2.9 Do features in this specification enable access to device sensors?](https://www.w3.org/TR/security-privacy-questionnaire/#sensor-data)

Similar to 2.8, Controlled Frame does not support enabling access to device sensors directly.

An embedded page may use a separate feature such as an IWA API or a
regular web API that allows sending data to the underlying platform. Through
that mechanism, it would then be possible for an IWA to interact with the
underlying platform.

## [2.10 Do features in this specification enable new script execution/loading mechanisms?](https://www.w3.org/TR/security-privacy-questionnaire/#string-to-script)

Controlled Frame does not alter script execution or loading mechanisms in the
embedder context.

However, core features of Controlled Frame support executing scripts in embedded
contexts, along with being able to alter or manipulate how an embedded page is
loaded via Controlled Frame's inclusion of the WebRequest API.

## [2.11 Do features in this specification allow an origin to access other devices?](https://www.w3.org/TR/security-privacy-questionnaire/#remote-device)

Similar to 2.8, Controlled Frame does not allow an origin to access other devices.

An embedder may support allowing embedded content to transmit either directly or
indirectly interactions with content hosted in other embedding controls. Both
direct and indirect types of interactions are discouraged to ensure that IWAs
can be audited.

## [2.12 Do features in this specification allow an origin some measure of control over a user agent’s native UI?](https://www.w3.org/TR/security-privacy-questionnaire/#native-ui)

Controlled Frame does not alter how an embedder context's UI operates.

Controlled Frame includes the Context Menus API, which allows an embedder to
manipulate what options appear and how they operate within an embedded context's
context menus.

## [2.13 What temporary identifiers do the features in this specification create or expose to the web?](https://www.w3.org/TR/security-privacy-questionnaire/#temporary-id)

Controlled Frame does not directly create new temporary identifiers. However, as
an embedding control, it provides a mechanism for an embedder to create a new
instance of a third-party origin which may then use other web APIs which may or
may not create temporary identifiers.

## [2.14 How does this specification distinguish between behavior in first-party and third-party contexts?](https://www.w3.org/TR/security-privacy-questionnaire/#first-third-party)

Controlled Frame is only available to be embedded to IWAs as a first-party
concept. Only third-party contexts are allowed to be embedded by Controlled
Frame, which ensures that a Controlled Frame cannot then embed a separate
[isolated
context](https://wicg.github.io/isolated-web-apps/isolated-contexts.html).

## [2.15 How do the features in this specification work in the context of a browser’s Private Browsing or Incognito mode?](https://www.w3.org/TR/security-privacy-questionnaire/#private-browsing)

For the purposes of an [isolated
context](https://wicg.github.io/isolated-web-apps/isolated-contexts.html), these
will not be available within a browser's Private Browsing or Incognito mode.
Since Controlled Frame is only available within isolated contexts, it should not
be available in a browser's Private Browsing mode.

## [2.16 Does this specification have both "Security Considerations" and "Privacy Considerations" sections?](https://www.w3.org/TR/security-privacy-questionnaire/#considerations)

Yes.

## [2.17 Do features in your specification enable origins to downgrade default security protections?](https://www.w3.org/TR/security-privacy-questionnaire/#relaxed-sop)

Controlled Frame allows embedders to interact with embedded content in
ways that support enabling the [motivating use
cases](https://wicg.github.io/controlled-frame/#motivating-applications). These
support interacting with content in ways that are impossible when the default
security protections are engaged and precisely followed.

For example:

  * Controlled Frame itself is a workaround of X-Frame-Options and
    frame-ancestors CSP.

  * WebRequest provides a way to remove security related headers of embedded
    content.

  * Script injection is a workaround of SOP as it lets a developer control
    script executed on another origin.

## [2.18 What happens when a document that uses your feature is kept alive in BFCache (instead of getting destroyed) after navigation, and potentially gets reused on future navigations back to the document?](https://www.w3.org/TR/security-privacy-questionnaire/#bfcache)

We expect that content that's non-fully active loaded in an embedding control
will become disconnected and will not be reused.

## [2.19 What happens when a document that uses your feature gets disconnected?](https://www.w3.org/TR/security-privacy-questionnaire/#non-fully-active)

That content will no longer be available for interaction with the embedding
control and any reinstantiation of the embedding control will lead to reloading
the embedded content from the associated URL.

## [2.20 Does your spec define when and how new kinds of errors should be raised?](https://www.w3.org/TR/security-privacy-questionnaire/#error-handling)

Yes.

## [2.21 Does your feature allow sites to learn about the user’s use of assistive technology?](https://www.w3.org/TR/security-privacy-questionnaire/#accessibility-devices)

Controlled Frame does not contain any accessibility features directly. Through
its use of embedding controls, we expect assistive technology such as screen
readers to be able to traverse the frame tree just as they can for other
embedding controls like &lt;iframe&gt;.

## [2.22 What should this questionnaire have asked?](https://www.w3.org/TR/security-privacy-questionnaire/#missing-questions)

It should have asked, "If your feature adds a new embedding control, what sorts
of data will be transferred between the embedder and embedded content?"

In this case, we allow transmitting, at the start of an embedding control,
nothing from the embedded content to the embedder. This is unlike an
&lt;iframe&gt; which allows embedded content to be aware of the parent embedder
before the parent makes it aware.

The embedder may execute script by transmitting JavaScript to the embedded
content, insert CSS, or add content scripts which the embedded content will load
on each page load.

The embedder may choose to allow the embedded content to pass messages back to
the embedder. That may either be done by injecting JavaScript that handles does
this, or by crafting the embedded content so it can receive such a message.

Using this message passing, many forms of serialized data can be transferred,
from JavaScript, CSS, to binary data such as blobs.

We strongly discourage developers from building an IWA that supports receiving
complicated objects or script and executing it outside of the embedded content.
