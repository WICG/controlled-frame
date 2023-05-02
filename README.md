# Controlled Frame Explainer

Authors:
Chase Phillips <[cmp@google.com](mailto:cmp@google.com)>,
Ovidio Ruiz-Henriquez <[odejesush@google.com](mailto:odejesush@google.com)>

Reviewers:
Austin Sullivan <[asully@google.com](mailto:asully@google.com),
Ayu Ishi <[ayui@google.com](mailto:ayui@google.com)>,
Dan Murphy <[dmurph@google.com](mailto:dmurph@google.com)>,
Evan Stade <[estade@google.com](mailto:estade@google.com)>,
Joshua Bell <[jsbell@google.com](mailto:jsbell@google.com)>,
Reilly Grant <[reillyg@google.com](mailto:reillyg@google.com)>,
Robbie McElrath <[rmcelrath@google.com](mailto:rmcelrath@google.com)>,
Zelin Liu <[zelin@google.com](mailto:zelin@google.com)>

Last updated: Jan 30, 2023

## Author's note: Work-in-progress specification available

A work-in-progress Controlled Frame API specification is available at [https://chasephillips.github.io/controlled-frame/](https://chasephillips.github.io/controlled-frame/). The specification bikeshed source is available at [/index.bs](/index.bs). The specification is not intended to be authoritative over this explainer and is currently only available for reference.

## Introduction

_Important: This explainer intends to only apply to Isolated Web Applications (IWAs). We expect no new APIs discussed here to be visible to or available to normal web pages. As Chromium developers we are aware of a limitation in our implementation that, for web pages, may expose via script-based policy introspection a policy-controlled feature that's always disabled. This is not intentional and we are exploring ways to restrict our new feature's visibility so it does not appear through policy introspection._

Today, a user directly controlling a web browser typically navigates to web content. However, in some cases, a web site may embed another resource, including third party content, into the browsing context. This occurs using the [`<iframe>` element](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element). [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element) is designed to prevent violations of the web's built-in resource policies by protecting embedded content from embedders and vice versa. As a result, while the majority of embedding use cases work very well using [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element), a small but important number of use cases are not supported.

In order to bring more use cases to the web platform and help developers build applications based upon web technologies instead of native applications, we want to provide an embedding environment to satisfy some critical use cases that [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element) does not support. This embedding environment should allow embedding all content -- including content which [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element) cannot embed -- and provide embedding sites more control over that embedded content. In addition, embedding a site's content should be possible without express permission from the embedded site.

This explainer proposes a new Controlled Frame element and API to achieve that level of embedding and control. We refer to our proposed API as the "Controlled Frame" API and, where available, the API can be accessed using the `<controlledframe>` element.

Since Controlled Frame is a particularly powerful API, using it or even having it available makes an app a target of various types of hacking. As a result, this API is limited to use in [Isolated Web Applications](https://github.com/WICG/isolated-web-apps/blob/main/README.md) (IWAs) which have additional safeguards in place to protect users and developers. You can read more details about the use of IWAs in the "Security Considerations" section. IWAs are not a normal web application and can exist only at a special 'isolated-app:' scheme. Making Controlled Frame only available to IWAs means by design that Controlled Frame will not be available to normal web pages.

Finally, note that controlled frames are not intended to be a replacement or a substitute for [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element). All [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element) use cases are still valid and should continue to use [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element), including IWAs where possible.

## Problem and Use Cases

[Isolated Web Apps](https://github.com/WICG/isolated-web-apps/blob/main/README.md) have no way to embed and control arbitrary web content directly into their applications. This is despite there being near-solutions available in the form of [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element) and some relatively newer isolated embedding approaches such as [`<fencedframe>`](https://github.com/WICG/fenced-frame). All of those approaches support parts of the desired feature set but no single approach supports all parts.

This proposal is meant to support enough of the feature set in a restricted way (through IWAs) so that content authors can build an isolated web app that solves the following use cases:

_Latency-sensitive applications in virtualized sessions_

In virtualized environments, users typically have a local thin client that renders a full virtual desktop. The actual desktop execution environment will be running on a remote virtualization server. If the user's browser navigates to a latency-sensitive application (such as a video app), the rendered content will have additional latency ("lag") that makes the experience difficult or impossible for the user. This also applies for applications that record the user, such as video conferencing applications. In these latency-sensitive applications, the virtual desktop application can render the latency-sensitive content locally and overlay it on top of the rendered remote content to reduce this latency. This use case is also known as "browser content redirection."

_Embedding third party web content without restriction_

In a kiosk environment, applications must load content from third parties and display that content on screens within their applications. A teacher may trigger the navigation event, or it may be configured by an administrator such as a shopping mall manager. The content may prohibit embedding by [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element) through the use of X-Frame-Options and CSP. An controlled frame, however, should be able to load all content, even content that prohibits embedding by [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element).

_Remote display and manipulation of web content_

In a kiosk environment, applications must ensure that content continues to display on screens and may need to interrupt content with their own supplied behaviors. This behavior should work without local attendance by an administrator, and ideally can be managed remotely over the network. If content were to crash, for example, these applications should observe and respond to the crash by reloading the content in a fresh embedded view.

_Clearing user content after each session_

In some environments, someone only uses a single device for a brief time to complete their task, like ordering in a restaurant. When their task is complete, the embedder application should be able to clear all of the local user data associated with the task and then restart the embedded instance.

_Monitor for idle sessions_

While users interact with embedded content, the user may not explicitly end their session. This content may assume the user is present when they have actually finished or departed without completing the task. Embedder applications want to detect when users idle over their case's threshold and begin a fresh session.

_Arbitrarily blocking navigations_

While displaying embedded web content that's not authored by the embedder, pages may link to third party web content that's disallowed. Allowing the embedder to edit elements in embedded content through arbitrary script injection into the web content can ensure navigation cannot occur to blocked pages. The embedder can also use the Controlled Frame API to capture navigation events and ensure that only pages to approved sites can be loaded within that controlled frame.

## Design Proposal

The Controlled Frame API is available only to IWAs, exposed via a new `<controlledframe>` element. The `<controlledframe>` element can be used by an embedder to create a new [top-level browsing context](https://html.spec.whatwg.org/#top-level-browsing-context) which can be controlled by that embedder via the Controlled Frame API.

Along with the `<controlledframe>` element, a "controlledframe" [policy-controlled feature](https://www.w3.org/TR/permissions-policy-1/#features) will be available. Both the element and policy-controlled feature will **only** be available to IWAs. An IWA can enable the "controlledframe" feature by including an "controlledframe" allowlist in its "[permissions_policy](https://github.com/WICG/isolated-web-apps/blob/main/Permissions.md#proposal)" manifest field.

If the user agent determines that Controlled Frame is available (i.e. the loading context is an IWA and the IWA enables the "controlledframe" feature), then the IWA page can make use of the `<controlledframe>` element. It will be possible for an IWA to create a child frame using [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element) that points to the IWA origin which could, if "controlledframe" is enabled through the child frame's permissions policy, also create a new `<controlledframe>` element.

The Controlled Frame element will:

-  allow embedding all content, including content that uses X-Frame-Options
-  embed content in a top-level browsing context
    -  for example, it will not expose to that Controlled Frame any DOM references to the embedder

-  render the Controlled Frame in a separate process
-  store Controlled Frame site data in a ["storage user agent"](https://storage.spec.whatwg.org/#model) apart from the default and IWA storage user agents
    -  the storage user agent may be in-memory or persist on disk
    -  the storage may be named by the IWA at the time of the Controlled Frame's creation

The Controlled Frame element takes a "src" attribute which must refer to an http-based, https-based, or data-based scheme. No other schemes will be allowed. This precludes creating a Controlled Frame element that points to an IWA scheme since, as proposed by [the IWA explainer](https://github.com/WICG/isolated-web-apps/blob/main/README.md#proposed-solution), IWAs will use an 'isolated-app:' scheme.

Our design for the Controlled Frame API uses the [Chrome Apps WebView API](https://developer.chrome.com/docs/extensions/reference/webviewTag/) as a starting point. It would be useful at this point for readers to become familiar with that API since it will be our starting point and this explainer will at times reference its methods, events, and types.

Also note that since the Chrome Apps WebView API was built on top of Chrome Apps, we expect adjustments from the previous API as we integrate proper support for newer web features like Permissions Policy and Permissions. In addition, differences may emerge in the first version and over time as we iterate and integrate feedback from developers. For example, we expect some methods (e.g. `getProcessId`) to not be available in the Controlled Frame API, along with other similarly-scoped changes.

### Background on Permissions Policy, Permissions, and Permissions Registry

The Controlled Frame API will build on top of the existing [Permissions Policy](https://www.w3.org/TR/permissions-policy-1/) and [Permissions](https://www.w3.org/TR/permissions/) areas. The relationship between Permissions Policy and Permissions is documented in the [Permissions specification](https://www.w3.org/TR/permissions/#relationship-to-permissions-policy). Also see the Permissions section ["Reading the current permission state"](https://www.w3.org/TR/permissions/#reading-current-states) for more about the relationship between the two specifications.

We recommend that you understand these specifications and how they interrelate. At a high-level:

-  **[Permissions](https://www.w3.org/TR/permissions/)** allows a user (or the owner of a device, in case the agent controlling the system doesn't own it) to allow or deny access to a function, with each entity referred to as a "permission"
    -  A permission is always in one of three states: ask, allow, or deny
    -  A permission request can be implicit or explicit
        -  Implicit requests occur while calling a feature's API and are part of the API's implementation
        -  Explicit requests can ideally occur via the [Permission API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) or, if that's not yet fully stabilized, by some other mechanism that we'll provide until that's stable

    -  Permission requests that are already "allow" or "deny" in the **[Permissions Registry](https://w3c.github.io/permissions-registry/)** are returned immediately (either sync or async) with that result state
    -  When a permission's state in the **[Permissions Registry](https://w3c.github.io/permissions-registry/)** is "ask" and a request occurs, the user agent prompts the user and the user's choice (allow or deny) is stored in the **[registry](https://w3c.github.io/permissions-registry/)**
    -  For reference, here are sample lists of available permissions in some browser engines available today: [Chromium](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/permissions/permission_descriptor.idl?originalUrl=https:%2F%2Fcs.chromium.org%2Fchromium%2Fsrc%2Fthird_party%2Fblink%2Frenderer%2Fmodules%2Fpermissions%2Fpermission_descriptor.idl), [Firefox](https://searchfox.org/mozilla-central/source/dom/webidl/Permissions.webidl#10), [WebKit](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/permissions/PermissionName.idl)  

-  **[Permissions Policy](https://www.w3.org/TR/permissions-policy/)** allows an app developer to enable or disable a feature, with each referred to as a "policy-controlled feature"
    -  A permissions policy **[allowlist](https://www.w3.org/TR/permissions-policy-1/#allowlists)** is a set of origins that can be either
        -  *, which represents every origin
        -  an ordered set of origins
        -  a set of keywords like 'self', 'src', or 'none' -- these are interpreted during parsing to their referenced origins and only the referenced origins are stored in the allowlist

    -  Every feature has a **[default allowlist](https://www.w3.org/TR/permissions-policy-1/#default-allowlists)** that determines:
        -  whether the feature is allowed in a document with no declared policy in a top-level browsing context
        -  and whether access to the feature is automatically delegated to documents in child browsing contexts
        -  the two allowed values are '*' and 'self'
        -  both '*' and 'self' allow the feature in top-level browsing contexts by default
        -  in '*' for child browsing contexts the feature is allowed by default
        -  in self for child browsing contexts that are same-origin, the feature is allowed by default, and for cross-origin, the feature is disallowed by default
        -  for example, [Geolocation's default allowlist is self](https://www.w3.org/TR/geolocation/#permissions-policy)

    -  A page can use the Permissions-Policy header to specify an allowlist, and the container policy for the page is determined based on the header and the default allowlist
    -  If no header is specified, the default value '*' is used which, on normal pages, means that all iframes with an allow attribute can use the feature
    -  IWAs will use a new "[permissions_policy](https://github.com/WICG/isolated-web-apps/blob/main/Permissions.md#proposal)" manifest field to list all policy-controlled features that the IWA wants enabled
    -  The IWA approach is more restrictive in that it will disable all features by default that aren't listed in that field
    -  The [PermissionsPolicy interface](https://www.w3.org/TR/permissions-policy/#permissionspolicy) keeps track of features, showing those that are enabled or disabled
    -  If a feature is unavailable or disabled and the feature has an associated permission, the **[Permissions Registry](https://w3c.github.io/permissions-registry/)** will set that permission to "deny"
    -  Scripts can [introspect the current policy](https://www.w3.org/TR/permissions-policy/#introspection) via a document or frame's [PermissionsPolicy interface](https://www.w3.org/TR/permissions-policy/#permissionspolicy)
    -  For reference, here's [the canonical list of policy-controlled features](https://github.com/w3c/webappsec-permissions-policy/blob/main/features.md) and [the associated MDN article](https://developer.mozilla.org/en-US/docs/Web/HTTP/Permissions_Policy)  

-  **[Permissions Registry](https://w3c.github.io/permissions-registry/)** keeps track of each permission's current state
    -  Allows relating Permissions and Permissions Policy, for features that have an associated permission
    -  In normal functioning, if a policy-controlled feature has a permission and the feature is disabled, the registry will set that permission to "deny"

In the following sections, we'll provide more details about how Controlled Frame integrates into these.

### The "controlledframe" Policy-Controlled Feature

The first way that the Controlled Frame API integrates with [Permissions Policy](https://www.w3.org/TR/permissions-policy-1/) is to define a new policy-controlled feature named "controlledframe". As a reminder, Permissions Policy allows an application developer to control the browser features available to a page, its frames, and subresources.

To enable Controlled Frame within an IWA, the IWA must define "controlledframe" in its manifest's "permissions_policy" field. Here's an example:

```
{
  ...
  "permissions_policy": { "controlledframe": [ "self" ] }
  ...
}
```

The list pointed to by the "controlledframe" key is known as the **allowlist**, which is an ordered list of origins or keywords used to define the permissions policy for the IWA application and its frames. You can read more about the allowlist in the Permissions Policy ["Allowlists" section](https://www.w3.org/TR/permissions-policy-1/#allowlists).

With allowlists, a developer can set a feature to '*', an ordered set of origins, or to include keywords like 'self', 'src', or 'none'. Keywords are resolved during parsing into their referent and only the referent is stored in the allowlist. In the example above, the "controlledframe" feature is enabled for the current origin and it's disabled by default in cross-origin frames.

Each policy-controlled feature has a **default allowlist**, which can either be '*' or 'self'. As a reminder, the difference between the two defaults controls the behavior for what the default should  be in a cross-origin child browsing context. For "controlledframe", the default allowlist will be 'self'.

### Within IWAs Where Controlled Frame is Disabled, a Special "Denied" `<controlledframe>` Element May Be Provided

For IWA contexts that have "controlledframe" disabled, these contexts will not be able to use Controlled Frame. For only these contexts, we may include a special "denied" `<controlledframe>` element with a slim API that makes it possible for code to introspect that the Controlled Frame feature is unavailable beyond checking for the "controlledframe" policy-controlled feature.

Outside of IWAs, this special "denied" `<controlledframe>` element will not be available. Attempting to use the `<controlledframe>` element or any Controlled Frame API in that non-IWA context will result in referencing an undefined element or accessing an API that's undefined.

### IWAs Allow Embedding Same-Origin and Cross-Origin Content

Besides Controlled Frame, the IWA proposal allows an IWA to embed same-origin and cross-origin content within an IWA frame using the `<iframe>` element. What content is allowed to be embedded is usually constrained by relevant security policies, such as [Content Security Policy (CSP)](https://www.w3.org/TR/CSP3/) and Cross-Origin* headers (e.g. [COOP](https://html.spec.whatwg.org/multipage/browsers.html#cross-origin-opener-policies), [COEP](https://html.spec.whatwg.org/multipage/browsers.html#coep), etc).

Within the [IWA proposal](https://github.com/WICG/isolated-web-apps/blob/main/README.md#proposed-solution), a strict CSP is set for IWAs:

```
Content-Security-Policy: base-uri 'none';
                         default-src 'self';
                         object-src 'none';
                         frame-src 'self' https:;
                         connect-src 'self' https:;
                         script-src 'self' 'wasm-unsafe-eval';
                         require-trusted-types-for 'script';
```

This CSP limits which origins with which an IWA context can interact.

Additional headers are also set:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
Content-Security-Policy: frame-ancestors 'self'
```

The CSP "frame-src" policy is the most relevant when it comes to dictating what content can be embedded. This policy dictates that an IWA can only embed frames if the src of the frame is either 'self', which corresponds to the same origin as the IWA itself, or if the scheme begins with 'https:'.

**Allowed:**

-  Embed iframe whose src is the same origin as the IWA itself
   -  Treated as same-origin.
   -  Examples:
      -  Load the top level IWA resource in an iframe
      -  Load a sub-resource in an iframe

-  Embed iframe whose src points to 'https:' content
   -  ... assuming the embedded content doesn't have an X-Frame-Options header
   -  Treated as cross-origin.
   -  Examples:
      -  Load 'https://example.com'

**Not Allowed:**

-  Embed an iframe element whose src points to another IWA
-  Embed an iframe element whose src points to any other scheme besides 'https:', including 'http:', 'data:', etc

### Embedder Policies Using the "controlledframe" Feature

The "controlledframe" policy-controlled feature can be used to not only enable Controlled Frame for the main IWA document, but also to either enable or disable Controlled Frame for an embedded child browsing context. This functionality only applies to embedding via the [`<iframe>` element](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element). For non-IWA embedded content, they will not have access to Controlled Frame, regardless of the permissions policy. And for IWAs embedding using Controlled Frame, non-IWA features like Controlled Frame itself aren't available and have no effect.

Recall that "controlledframe" has a default allowlist of 'self'. In those instances, cross-origin uses of a feature with a 'self' default allowlist sets the state for a policy-controlled feature in a child browsing context to disabled by default. This is moot for our purposes since there's no cross-origin context from an IWA that will allow Controlled Frame to be enabled.

Given that an IWA is allowed to embed same-origin content using `<iframe>`, the "controlledframe" policy can either be enabled or disabled in that child browsing context.

_To enable Controlled Frame and gain access to the Controlled Frame API, use these steps:_

-  Controlled Frame must be enabled in embedding frame
-  The iframe should either:
    -  Not include the allow attribute
    -  Not specify "controlledframe" in the allow attribute
    -  Specify a permissive "controlledframe" allow attribute

-  Embedded content must not have a Permissions-Policy disabling Controlled Frame
-  IWA must specify "controlledframe" in its manifest "permissions_policy" field

Result: Container policy allows enabling Controlled Frame

_To disable Controlled Frame which will expose the special "Denied" Controlled Frame API, use these steps:_

-  The iframe should include the allow attribute
-  The iframe allow attribute should specify either:
    -  "controlledframe=()"
    -  "controlledframe=none"
    -  a "controlledframe" policy that excludes the IWA origin

-  The embedded content should specify either with its Permissions-Policy:
    -  "controlledframe=()"
    -  "controlledframe=none"
    -  a "controlledframe" policy that excludes the IWA origin

Result: Container policy disallows enabling Controlled Frame

**Note: Embedding cross-origin non-IWA content within an IWA:**
IWAs can create cross-origin navigables using [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element) by targeting a different origin in the "src" attribute as long as they use a non-IWA scheme (such as "https://") and the right headers (eg. CORP, COOP, COEP). These navigables will be treated like a regular web page and are not IWAs. Since "controlledframe" is not available outside of IWAs, then attempting to enable the "controlledframe" feature in those contexts simply will not work. That is, they will have neither the `<controlledframe>` element nor the special "denied" `<controlledframe>` element.

### Policy Visibility through Introspection

Permissions Policy supports [policy introspection through script](https://www.w3.org/TR/permissions-policy-1/#introspection). This allows content to detect which features are enabled and which are disabled within the current browsing context. IWAs will see the "controlledframe" policy-controlled feature via the [PermissionsPolicy interface](https://www.w3.org/TR/permissions-policy/#permissionspolicy), and in those cases it will show either as enabled (available for use) or disabled (unavailable for use).

IWAs that do not include the "controlledframe" feature in their manifest's "permissions_policy" key (for the top-most navigable), those that include a Permissions-Policy header that disables "controlledframe" or IWA frames that have a policy disabling the "controlledframe" feature will see the "controlledframe" feature as disabled.

The "controlledframe" policy-controlled feature isn't relevant to non-IWA pages, and so it will not be exposed to those pages via the PermissionsPolicy interface. For Chromium-based implementations, we will explore making the "controlledframe" feature policy invisible to normal web pages.

### The "controlledframe" Feature Has No Associated Permission

Once the Controlled Frame feature is enabled via [Permissions Policy](https://www.w3.org/TR/permissions-policy-1/), no permission is needed to use the feature.

We will not add a "controlledframe" permission to the [Permissions](https://www.w3.org/TR/permissions/) and [Permissions Registry](https://w3c.github.io/permissions-registry/) and the "controlledframe" policy-controlled feature will have no associated permission.

### Supporting Permissions Policy

Controlled Frame creates a new container for nested browsing. As part of creating the container and establishing it to hold web content, Controlled Frame implements support for Permissions Policy. This allows Controlled Frame to participate in inheriting, establishing, and enforcing policies.

1. **A Controlled Frame container's policy might not match the default top-level document container policy:** Permissions Policy establishes that each feature specifies whether they should be enabled or disabled by default in a top-level document. Since IWAs disable all features unless specified in "permissions_policy," and since IWAs may enable features that are disabled by default using "permissions_policy," the Controlled Frame's container policy may differ from that of a default top-level document container policy.

1. **Policy introspection could expose that content is embedded:** By accessing the PermissionsPolicy interface, script in embedded content may detect that a feature is disabled where it is normally enabled, or vice versa. Through this mechanism, [similar to this note](https://www.w3.org/TR/permissions-policy-1/#privacy-expose-policy), content may infer it is embedded via Controlled Frame. This inference is conceptually similar to incognito mode detection. Similar to incognito mode protections, we may at some point explore presenting PermissionsPolicy to script with apparent default settings while ensuring the policy in-fact matches the IWA's policy.

1. **The IWA's policies will influence what policies are enabled in a Controlled Frame:** The container permissions policy a Controlled Frame nested browsing context gets will be computed based on a set of policies, including the IWA's container policy for which features are enabled in the embedding IWA frame. As an input policy, if the IWA's embedding frame doesn't enable a feature, then the resulting container policy will have that feature disabled. Also, all IWA-specific features -- such as "controlledframe" and "direct-sockets" -- aren't available outside of IWAs and will be disabled within a Controlled Frame nested browsing context.

1. **Controlled Frame will have a restrictive default container policy:** As an input into how policies are computed for permissions policy of embedded content, Controlled Frame will have a default container policy. This policy will be similar to an [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element)'s default container policy for cross-origin embedded content: all features have a default (either '*' or 'self'), and their selected default will influence the [feature setting in a cross-origin child browsing context](https://www.w3.org/TR/permissions-policy/#default-allowlists). For example, the default for the "geolocation" feature is 'self', which is disabled by default in a frame's child browsing context.

1. **Controlled Frame will support an "allow" attribute:** All Controlled Frame are effectively cross-origin, so they should follow the same pattern as cross-origin iframes and require an explicit allowlist. This approach is similar to [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element)'s ["allow" attribute](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#attr-iframe-allow). For a Controlled Frame container, the policy will be computed using the policy header of the embedded content, the allowlist provided in the allow attribute, the default policy for Controlled Frame, and the permissions policy of the embedding frame.

1. **Without the "allow" attribute, the Controlled Frame will compute a policy using its restrictive policy default:** By default, if an allowlist isn't specified with the "allow" attribute, then the container policy will be the computation of the permissions policy header of the embedded content, the default policy for Controlled Frame, and the permissions policy of the embedding frame. Most features will be disabled in the nested browsing context.

### Supporting Permissions

Controlled Frame also allows IWAs to directly manage permission requests, supporting Permissions.

1. **Controlled Frame origins' permissions are unrelated to that origin's permissions outside of the Controlled Frame and IWA:** Permissions already allowed or denied for a given "origin" already in the browser user agent are unrelated to an instance of that origin in the Controlled Frame.

1. **Permissions needed in a Controlled Frame must first be granted to the IWA:** Since IWAs ultimately control Controlled Frame and can interact with them, granting a permission to the Controlled Frame is effectively providing that permission to the IWA. From the user's perspective, the IWA is the root of authority and users will be authorizing the IWA for any permission request.

1. **Controlled Frame embedded content can request permissions:** Embedded content can request permissions, similar to content within an `<iframe>`, but only for features that are enabled. Disabled features will return a permission denied result immediately. For enabled features, Controlled Frame permission requests will be denied by default if the IWA chooses not to handle permission requests for that Controlled Frame.

1. **IWAs must manage Controlled Frame content permission requests:** Through a "permissionrequest" event handler ([example API](https://developer.chrome.com/docs/extensions/reference/webviewTag/#event-permissionrequest)), IWAs can respond to permission requests from embedded content. The handler exposes an API that grants an embedder the ability to deny a request. The API also grants an embedder the ability to allow a request, if the IWA itself already has that permission allowed.

1. **Permission requests that aren't handled cause a "deny" result**: Controlled Frame allow embedding any site, including third party sites not under the IWA's control. Since Controlled Frame requires IWAs to manage permissions and permission requests, and to ensure that embedded content's use of permissions doesn't result in a poor user experience, the user agent will automatically deny any permission request that an IWA doesn't manage. One way a request may be unhandled is if no handler is present. Another way is if a handler is present and fires, but the IWA does not call allow or deny on the event object. In both of these examples, the request will be denied.

1. **IWAs can request a permission while handling a Controlled Frame's permission request:** If an IWA is handling permissions for a Controlled Frame and the Controlled Frame requests a permission for a feature, the IWA will receive a "permissionrequest" event. While processing that request, the IWA can use the request API to trigger a request to the user and then, as part of the IWA's permission request's asynchronous processing, the original Controlled Frame permission request can be replied to with an appropriate response. Note: the Permission API request method isn't yet stable so our design will avoid relying on explicit Permission API permission requests and will present another method that's part of the "permissionrequest" event handler. (Once the Permission API request method is stable, we can adjust this design to rely upon it.)

1. **An IWA can use Permission API .query() to introspect if it already has a permission:** While handling a permission request, the IWA can call .query() to confirm the current PermissionStatus for a given permission. This allows the IWA to, for example, provide special handling if the permission is already allowed or denied in the IWA. This also allows the IWA to prepare for the possibility of prompting the user to allow or deny a permission for the IWA.

While this represents our first version of support in Controlled Frame for Permissions Policy and Permissions, we are aware that there are additional areas here where the design may be improved. Future work in these areas may include:

1. For Chromium-based implementations, hiding the "controlledframe" permissions policy for non-IWA contexts so that it's not visible to normal web pages via script policy introspection. (**Note**: while it may be visible on normal web pages, it will always be disabled.) This work could be reused to hide the "direct-sockets" policy-controlled feature, as well.

1. Adding an imperative policy handler that the user agent could call when a Controlled Frame is navigated. This would allow an embedder to choose per-navigation what features to enable or disable.

1. Adjusting the [PermissionsPolicy interface](https://www.w3.org/TR/permissions-policy/#permissionspolicy) in embedded content so that, similar to incognito mode protections, embedded content may only see feature states as if it was a top-level document rather than the actual feature state. Like incognito mode protections, permission requests could be auto-denied (with a random time delay) so that features that appeared enabled were behaving practically as if they were disabled.

### Requirements to Enable a Permission in a Controlled Frame's Nested Browsing Context

In summary, in order for a permission request to be granted, all of the following must be true:

1. The IWA must have the policy-controlled feature corresponding to the permission listed in the "permissions_policy" manifest field so that it's enabled in the IWA
1. If the feature is disabled by default by Controlled Frame's default container policy, the Controlled Frame's allow="" attribute must be set and include the feature with the correct origin or keywords
1. The Controlled Frame must not have blocked the feature -- e.g. via the page's Permissions-Policy header or through a nested iframe in the page
1. The IWA must have a working "permissionrequest" handler installed for that Controlled Frame
1. The Controlled Frame must either explicitly or implicitly request that permission
1. The IWA must not ignore the Controlled Frame's permission request until it is able to respond with the "allow" method
1. The IWA must already have the permission allowed in its Permissions Registry, possibly by requesting it while the Controlled Frame's permission is "in flight"
1. The IWA must allow the Controlled Frame's request through script by calling "allow" on the in-flight request object

### Exploring How IWAs and Controlled Frame Interact within Permissions Policy and Permissions

Given the many potential combinations for how IWAs and Controlled Frame could interact within the policy and permissions space, it will help to call out the main attributes that determine the differences in behaviors and outcomes.

Does the IWA enable or disable a policy-controlled feature via its manifest's "permissions_policy" field?

-  If a feature isn't included in the "permissions_policy" field, then the feature won't be enabled in the IWA.
-  Assume that "controlledframe" is included, so that the IWA can use Controlled Frame and the IWA creates a Controlled Frame for [https://example.com](https://example.com).
-  The Controlled Frame's PermissionsPolicy interface will show that only features listed in the IWA's "permissions_policy" field are enabled, and all others will be disabled.

Is the policy-controlled feature enabled or disabled by default in top-level documents?

-  For every feature, there's a specified setting (either enabled or disabled) for top-level documents.
-  If the feature is normally enabled in top-level documents but disabled in the IWA and Controlled Frame, the embedded content may determine it is within a Controlled Frame.
-  The same would be true if the feature is normally disabled in top-level documents but enabled in the IWA and Controlled Frame.

If a policy-controlled feature does not have an associated permission...

-  then Controlled Frame embedded content is free to use the feature without any permission request.

If the IWA does not handle permission requests for the Controlled Frame...

-  then the user agent will deny the request.

If the IWA handles permission requests for the Controlled Frame...

-  then the IWA can intercept the request.
-  If the IWA ignores the request by not calling allow or deny, then the user agent will deny the request.
-  If the IWA has the permission already, it can allow or deny the request directly.
-  If the IWA allows a permission that it doesn't yet have, then the request will be denied and an exception thrown.
-  If the IWA doesn't have permission, then it can request the same permission from the user agent and, in an asynchronous response called after the IWA's request is handled, respond to the Controlled Frame request.

### An Example of Using the Geolocation Feature and Permission

It may be helpful to some to present examples of how this will work in practice at this point. We'll include two examples of using the Geolocation feature and permission. The first example is where the geolocation feature is enabled, while the second shows where the geolocation feature is disabled.

**Use case: The Geolocation feature is enabled**

1. The IWA enables "geolocation" and "controlledframe" in its permissions_policy manifest field
   - manifest's permissions_policy:
   - ```{ "geolocation": [ "self", "example.com" ], "controlledframe": [ "self" ] }```

1. The IWA creates a Controlled Frame with src `https://example.com/` and listens for the "permissionrequest" event
1. The Controlled Frame has a default [PermissionsPolicy interface](https://www.w3.org/TR/permissions-policy/#permissionspolicy) which shows that geolocation is "enabled"
1. Embedded content requests the permission
1. The IWA's "permissionrequest" event handler is called
1. IWA calls the "request" method to ask the user agent to request the permission from the user
1. The user agent shows a prompt to the user with the "allow" and "deny" choices -- the prompt will show the IWA's app name
1. The user clicks "allow" -- the user's choice can be stored with the IWA app's permission settings as associated with the IWA
1. The user agent provides the IWA handler the allow response from the user and the IWA replies to the Controlled Frame's "permissionrequest" event allowing the permission
1. Embedded content gets a "permission allowed" response

**Use case: The Geolocation feature is disabled**

1. The IWA enables "controlledframe" in its permissions_policy manifest field, but not "geolocation"
   - manifest's permissions_policy:
   - ```{ "controlledframe": [ "self" ] }```

1. The IWA creates a Controlled Frame with src `https://example.com/` and listens for the "permissionrequest" event
1. The Controlled Frame has a default [PermissionsPolicy interface](https://www.w3.org/TR/permissions-policy/#permissionspolicy) which shows that geolocation is "disabled"
1. Embedded content requests the permission
1. The user agent returns immediately with denied
1. The "permissionrequest" event is not triggered so the IWA doesn't know the permission was requested

## Example Usage

### App Manifest

```
{
  ...
  "permissions_policy": { "controlledframe": [ "self" ] }
  ...
}
```

### HTML

```
<html>
<body>
  <!-- Create a Controlled Frame element -->
  <!-- use optional partition prefix "persist:" to put the partition on disk -->
  <controlledframe id="controlledframe" src="https://example.com" partition="persist:exampleframe">

  <button id="load_example_bar">Load https://example.com/bar</button>
  <button id="load_home">Home</button>
  <button id="back">Back</button>
  <button id="forward">Forward</button>
</body>
</html>
```

### JavaScript

```
function addHandlers() {
  // Load https://example.com/bar on click.
  document.getElementById('load_example').addEventListener('click',
    (ev) => {
      const controlledframe = document.getElementById('controlledframe');
      controlledframe.src = "https://example.com/bar";
    }
  );

  // Navigate home.
  document.getElementById('load_home').addEventListener('click',
    (ev) => {
      const controlledframe = document.getElementById('controlledframe');
      controlledframe.src = "https://example.com/";
    }
  );

  // Navigate back.
  // Note: The API we're basing on uses callbacks. We don't yet know when we can
  // introduce a promises-based API, we're still evaluating that.
  document.getELementById('back').addEventListener('click',
    (ev) => {
      const controlledframe = document.getElementById('controlledframe');
      controlledframe.back({callback: (success) => {console.log(`${success}`)}});
    }
  );

  // Navigate forward.
  // Note: The API we're basing on uses callbacks. We don't yet know when we can
  // introduce a promises-based API, we're still evaluating that.
  document.getELementById('forward').addEventListener('click',
    (ev) => {
      const controlledframe = document.getElementById('controlledframe');
      controlledframe.back({callback: (success) => {console.log(`${success}`)}});
    }
  );
}

// Capture a still image of a loaded page:
controlledframe.captureVisibleRegion({
  format: 'jpg',
  quality: 100,
}, (dataURL) => {
  result.src = dataURL;
});

// Execute JavaScript within the Controlled Frame to remove all links from
// <a> elements and add 'inject_script.js' to the Controlled Frame's script sources:
controlledframe.executeScript({
    code: `
      const anchorTags = document.getElementByTagName('a');
      for (const tag of anchorTags)
        tag.href = '';
    `,
    files: ['./inject_script.js'],
  }, (result) => {
    console.log(JSON.stringify(result))
  }
);
```

## Security Considerations

**Controlled Frame is based upon IWA and integrates with core security specs**

Since Controlled Frame is a particularly powerful API, using it or even having it available makes an app a target of various types of hacking. As a result, this API is limited to use in [Isolated Web Applications](https://github.com/WICG/isolated-web-apps/blob/main/README.md) (IWAs) which have additional safeguards in place to protect application developers and users. The [Isolated Web App explainer](https://github.com/WICG/isolated-web-apps/blob/main/README.md) has this to say:

> _"A user agent may also force an application to adopt this threat model if the developer needs access to APIs which would make the application an appealing target for XSS or server-side attacks."_

Controlled Frame makes just such an appealing target, and to expose this with caution we're opting into IWA to guard against certain attacks. Generally, IWAs provide strong security assurances that each of the resources in an application are secure both at rest and in-transit. You can read more about IWA security and permissions in the [IWA explainer](https://github.com/WICG/isolated-web-apps) and the IWA "[High Watermark Permissions Explainer.](https://github.com/WICG/isolated-web-apps/blob/main/Permissions.md)"

Controlled Frame integrates with Permissions Policy and Permissions. You can read more about [Permissions Policy security and privacy considerations](https://www.w3.org/TR/permissions-policy-1/#privacy-and-security). You can read more about [Permissions security considerations](https://www.w3.org/TR/permissions/#security-considerations) (note the entry is currently sparse).

**Attacking web sites could display content that doesn't otherwise allow itself to be embedded and trick users on non-IWAs**

Planned mitigation: Controlled Frame will only be available within IWAs

**An IWA may embed another IWA (or itself) via Controlled Frame to manipulate our IWA policies somehow**

e.g. an embedded IWA (via a Controlled Frame) may detect it's being embedded due to the absence of the "controlledframe" policy-controlled feature

Planned mitigation:

-  Controlled Frame can only point to "https" schemes, excluding the "isolated-app" scheme used for IWAs

**Controlled Frame could gain access to the powerful <controlledframe> element**

An IWA that's not expected to use Controlled Frame may attempt to embed content

Planned mitigation:

-  Only embedder applications and their same-origin IWA child navigables that have been granted the "controlledframe" policy-controlled feature will be allowed access to the Controlled Frame element
-  Same-origin child navigables without the "controlledframe" policy-controlled feature will not be allowed to use a Controlled Frame element (to be confirmed, see note below)
-  Cross-origin iframes to IWAs can use the "allow" attribute to disable Controlled Frame
-  Cross-origin iframes to non-IWAs will not have access to the "controlledframe" policy-controlled feature, and so will not be allowed to use a Controlled Frame element
-  See the "Embedder Policies Using the "controlledframe" Feature" section above for more details

**An IWA may attempt to embed content from non-https schemes, such as 'http:' or 'isolated-app:'**

Planned mitigation:

-  Controlled Frame will only work when the navigable's "src" URL has an 'https:' scheme

**Malicious Controlled Frame could access the embedder's running process (eg. Spectre attack)**

Planned mitigation:

-  Controlled Frame will be executed in a separate process from the embedder's process

**Controlled Frame for a given "https origin" could interact or interfere with the user's own storage user agent data for that https origin**

Planned mitigation:

-  Controlled Frame will always store data in a separate storage user agent that's apart from the default storage user agent
-  Data written to by a given "https origin" while the user accesses that origin via an IWA Controlled Frame will be isolated from the user's storage user agent that backs "normal" window and tab usage, and vice versa

**Malicious Controlled Frame could overwrite embedder's stored data**

-  The embedder and embedded storage user agent could overlap, and possibly multiple same-site IWA child navigables could be affected by activity in the Controlled Frame
-  If storage user agents were shared between the embedder and embedded sites, clearing data for either one could negatively impact the other

Planned mitigation:

-  IWA and Controlled Frame will always have separate storage user agents
-  A Controlled Frame should not have read or write access to other storage user agents besides its own

**Malicious Controlled Frame may detect it is embedded and attempt to attack the embedder application**

Planned mitigation:

-  The user agent will match the browser.
-  The Controlled Frame storage user agent will be separate from the IWA and the default storage user agents.
-  The Controlled Frame process will be separate from the IWA and the default renderer and browser processes.
-  The Controlled Frame environment will appear to be the top-most navigable:
    -  window should match window.parent and window.top
    -  List of policy-controlled features and their disable/enable status should match the default for a navigable

Ideas:

-  Investigate for potential interactions around filesystem, quota storage, and localStorage APIs

**User may not be able to verify the origin of the page being viewed in the Controlled Frame**

Ideas:

-  Expose the origin to the user somehow, such as adding UI at the top of a Controlled Frame that displays the origin?
-  Have the IWA specify in the manifest the origins that they expect to access?

**Controlled Frame may exploit vulnerabilities in out-of-date browser engine**

Already addressed with:

-  Existing browser engine auto-update mechanisms

## Privacy Considerations

Controlled Frame integrates with Permissions Policy and Permissions. You can read more about [Permissions Policy security and privacy considerations](https://www.w3.org/TR/permissions-policy-1/#privacy-and-security). You can read more about [Permissions privacy considerations](https://www.w3.org/TR/permissions/#privacy-considerations).

For Controlled Frame specifically, we've identified the following privacy considerations:

-  Users' browsing within Controlled Frame will be visible to the IWA
-  IWAs can access and exfiltrate the Controlled Frame's session cookies (this only applies to the Controlled Frame's session since they use a separate storage partition from the IWA and the third party origin when browsed in a tab)
-  User activity in Controlled Frame can be observed by the IWA (e.g. keyboard events can be monitored, password entry can be sniffed)
-  User file upload to Controlled Frame can be hijacked
-  User data held in the Controlled Frame's remote server could be accessed by code implanted by the IWA
-  Users that wish to clear their session history must also do so via the IWA, which will then need to clear the associated storage user agents
    -  This would be necessary since embedded storage user agents are separate from the non-embedded storage user agents for any given https origin

-  We plan to investigate browser UX to allow users to clear the Controlled Frame storage user agents, the following cases will be considered:
    -  If a user wants to clear site data for an IWA, the associated embedded storage user agents will also be cleared
        -  This is because if the IWA's data is cleared, the app will no longer have any context for the associated embedded storage user agents and therefore will no longer be used or useful to the user or organization
        -  As a result, we expect that clearing an IWA's site data will require clearing all of the associated embedded storage user agents

    -  A user may want to clear all site data for a given "https origin", even if that origin is stored within an IWA's embedded storage user agent
        -  We may choose to provide the ability to clear all IWA site data for that "https origin" even if that site data is held within an embedded storage user agent
        -  If we chose to clear the "https origin" data, IWAs would need to prepare for the possibility that embedded storage user agents may be removed outside of their control, and this may be disruptive to the IWA and introduce complexity of implementation
        -  Supporting this in the browser user agent exposes browser vendors, developers, and users to additional complexity, so we may choose not to support this approach and instead leave this up to IWA developers to implement
        -  As a counter example to supporting clearing a single given "https origin"'s embedded storage user agent, consider that to our knowledge no operating system behaves that way
            -  i.e. there's no central "clear browsing data" option which clears storage for all installed browser engines, each application's storage is treated as its own to manage

    -  User wants to clear the site data for a given IWA's Controlled Frame-embedded storage user agent for a given "https origin"
    -  User wants to clear the site data for a given IWA's Controlled Frame-embedded storage user agents for all "https origins"

-  An IWA will need the ability to clear the storage user agent's Controlled Frame-embedded storage user agent for a given "https origin"

## Accessibility Considerations

For Controlled Frame, we've identified the following accessibility considerations:

-  Browser user agents' accessibility tools and APIs should have visibility into Controlled Frame
-  IWAs should expect to provide their own accessibility tools for Controlled Frame content in order to properly integrate accessibility features for some use cases (such as "browser content redirection")

## Further Considerations

For Controlled Frame, we've identified these further considerations:

-  A single IWA may choose to create and manage multiple Controlled Frame instances
-  Within some contexts, users may desire a Controlled Frame-like experience but will not be able to trigger this directly. For example, in the context of a VDI application with the Browser Content Redirection use case, only the IWA will be able to trigger its usage (e.g. a user may want the Browser Content Redirection functionality for a site but only the IWA can enable that).
-  Some services may not be compatible with Controlled Frame implementations (eg. "[Login With Amazon](https://developer.amazon.com/docs/login-with-amazon/webview.html)")
-  Popups should work as if the Controlled Frame was a top-level document
    -  The Controlled Frame API contains [a "newwindow" event](https://developer.chrome.com/docs/extensions/reference/webviewTag/#event-newwindow) to capture popup events, allowing the IWA to manage those events

-  No synchronization method exists for multi-storage user agent use cases to sync their cookie stores
    -  For some use cases, like Browser Content Redirection, the user's browsing session will be split across multiple storage user agents
    -  In the BCR use case, there will be one storage user agent on the VDI server and one on the local device
    -  Within a virtualized session, the user will navigate a web browser whose storage user agent exists on the remote virtualization server
    -  Within that virtualized session, the user may navigate to an origin and sign in there, so at that point the user's cookies reflect being signed in to the origin within the remote server's storage user agent
    -  BCR operating as an extension in the remote browsing session may determine the origin should be hosted within a Controlled Frame rendered on the local device
    -  Once BCR requests the local application to initiate a Controlled Frame on the local device, the local application will create a new Controlled Frame instance with a local storage user agent, and this agent will not have any cookies
    -  The user will be prompted to sign in again within the Controlled Frame instance
    -  We may in the future investigate this to streamline user experience so that some use cases like Browser Content Redirection do not require multiple user sign-ins

## Stakeholders

While many use cases addressed by APIs in the Web Platform target the "User" and "Developer," the Controlled Frame API is meant to target more advanced use cases that separate concerns across roles in the participating "Organization." In a typical use of Controlled Frame, we've identified these stakeholders:

-  User
-  IWA Developer
-  Vendor/integrator
-  Customer
-  Embedded content

Furthermore, we've identified where use cases separate the organization into integrators and customer organizations. Which person or organization maps into these stakeholder roles can vary depending on use case. Here's an example mapping for two use cases:

**Virtualization**
* User: Employee
* IWA Developer: Virtualization software developer
* Vendor/Integrator: Virtualization software developer
* Customer: Small- to Medium-sized Business (SMB), Enterprise business
* Embedded Content: Latency-sensitive applications
* Trade-offs to consider:
  *  Employees expect latency-sensitive applications like video conferencing and video applications to not be choppy. Some browsing experiences need to be displayed locally on their thin client where the desktop viewing software runs.

**Kiosk**
* User: Consumer
* IWA Developer: Org that designed and implemented the kiosk environment
* Vendor/Integrator: Org that assembled the Developer's environment with remaining pieces, running or selling to the Customer
* Customer: Restaurant, Shopping Plaza
* Embedded Content: Various merchant websites
* Trade-offs to consider:
  * Consumers will use the kiosk and expect all previous interactions from other consumers to be cleared.
  * Consumers will not be allowed to view disallowed content. All navigations should be to approved resources.

## Alternatives Considered

**_[`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element)_**

The iframe element allows embedding first and third party content with the caveat that content can reject being embedded using X-Frame-Options. In addition, iframes:

-  expose that the embedded content is not the top-most navigable
-  shares a storage user agent with the embedder
-  in some cases may be rendered in the same process

Finally, iframes are not designed to allow controlling embedded content. While communication is possible between an iframe embedder and the embedded content, there's little additional capability that iframes give an embedder to control the embedded content's browsing context.

**_[Anonymous iframes](https://chromestatus.com/feature/5729461725036544)_**

Anonymous iframes differ from iframes in that their content is loaded from an ephemeral storage user agent which isn't subject to COEP restrictions. Aside from this change, all other restrictions present in [<iframe>](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element) are present in Anonymous iframes.

**_[`<fencedframe>`](https://developer.chrome.com/en/docs/privacy-sandbox/fenced-frame/)_**

Similar to [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element), [`<fencedframe>`](https://developer.chrome.com/en/docs/privacy-sandbox/fenced-frame/) allows embedders to display embedded web content. Unlike [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element), the [`<fencedframe>`](https://developer.chrome.com/en/docs/privacy-sandbox/fenced-frame/) element ensures that the embedded content is isolated from the embedder so that embedded content will not be available to the embedding site, and vice versa.

**_[`<embed>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-embed-element) and [`<object>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-object-element)_**

Deprecated. These elements were once popular to embed content, usually not "nested navigable content" but instead data like plugin content or raw data like SVG. The nested navigable embedder option was introduced with `<frame>` and [`<iframe>`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element).

## Acknowledgements

-  Alex Moshchuk <[alexmos@google.com](mailto:alexmos@google.com)>
-  Austin Sullivan <[asully@google.com](mailto:asully@google.com)>
-  Ayu Ishii <[ayui@google.com](mailto:ayui@google.com)>
-  Chris Harrelson <[chrishtr@google.com](mailto:chrishtr@google.com)>
-  Dan Murphy <[dmurph@google.com](mailto:dmurph@google.com)>
-  Devlin Cronin <[rdcronin@google.com](mailto:rdcronin@google.com)>
-  Evan Stade <[estade@google.com](mailto:estade@google.com)>
-  Ibrahim Karahan <[ibo@google.com](mailto:ibo@google.com)>
-  Joshua Bell <[jsbell@google.com](mailto:jsbell@google.com)>
-  Kevin McNee <[mcnee@google.com](mailto:mcnee@google.com)>
-  Michael Rumely <[michaelrumely@google.com](mailto:michaelrumely@google.com)>
-  Miguel Alvarez <[migue@google.com](mailto:migue@google.com)>
-  Reilly Grant <[reillyg@google.com](mailto:reillyg@google.com)>
-  Robbie McElrath <[rmcelrath@google.com](mailto:rmcelrath@google.com)>
-  Vincent Scheib <[scheib@google.com](mailto:scheib@google.com)>
-  W. James Maclean <[wjmaclean@google.com](mailto:wjmaclean@google.com)>
-  Zelin Liu <[zelin@google.com](mailto:zelin@google.com)>

## References

-  Background on WebView technologies
    -  [Making WebViews work for the Web – 18 October 2021](https://www.w3.org/2021/10/18-webviews-minutes.html)
    -  [Hobson's Browser - Infrequently Noted](https://infrequently.org/2021/07/hobsons-browser/)
    -  [Security Considerations - OAuth 2.0 Simplified](https://www.oauth.com/oauth2-servers/mobile-and-native-apps/security-considerations/)

-  More about `<iframe>`
    -  [From object to iframe — other embedding technologies - Learn web development | MDN](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Other_embedding_technologies)
    -  [`<iframe>`: The Inline Frame element - HTML: HyperText Markup Language | MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe)

-  `<fencedframe>`, aka Fenced Frames
    -  [https://github.com/WICG/fenced-frame](https://github.com/WICG/fenced-frame)
    -  [https://github.com/WICG/fenced-frame/tree/master/explainer](https://github.com/WICG/fenced-frame/tree/master/explainer)
    -  [https://github.com/WICG/fenced-frame/blob/master/explainer/permission_document_policies.md](https://github.com/WICG/fenced-frame/blob/master/explainer/permission_document_policies.md)
    -  [https://developer.chrome.com/en/docs/privacy-sandbox/fenced-frame/](https://developer.chrome.com/en/docs/privacy-sandbox/fenced-frame/)

-  Resource and embedding policies
    -  [Cross-Origin Embedder Policy](https://wicg.github.io/cross-origin-embedder-policy/)

-  Permissions
    -  [https://www.w3.org/TR/permissions/](https://www.w3.org/TR/permissions/)
    -  [https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)
    -  [What Web Can Do: Permissions](https://whatwebcando.today/permissions.html)

-  Permissions Registry
    -  [https://w3c.github.io/permissions-registry/](https://w3c.github.io/permissions-registry/)

-  Permissions Policy
    -  [https://www.w3.org/TR/permissions-policy-1/](https://www.w3.org/TR/permissions-policy-1/)
    -  [Feature Policy - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy)
    -  [Controlling browser features with Permissions Policy - Chrome Developers](https://developer.chrome.com/en/docs/privacy-sandbox/permissions-policy/)
    -  [https://scotthelme.co.uk/goodbye-feature-policy-and-hello-permissions-policy/](https://scotthelme.co.uk/goodbye-feature-policy-and-hello-permissions-policy/)
    -  [https://httptoolkit.com/blog/renaming-feature-policy-to-permissions-policy/](https://httptoolkit.com/blog/renaming-feature-policy-to-permissions-policy/)
    -  [Feature Policy directives and origins lists *, self, none, src; Feature policy declaration through the allow= attribute and through the Feature-Policy HTTP header; allowedFeatures(), allowsFeature(), features(), getAllowlistForFeature() methods](https://csplite.com/fp/)
    -  [Deprecating Permissions in Cross-Origin Iframes](https://www.chromium.org/Home/chromium-security/deprecating-permissions-in-cross-origin-iframes/)
    -  [Intent to Deprecate on-by-default Permissions in Cross-origin Iframes](https://groups.google.com/a/chromium.org/g/blink-dev/c/mG6vL09JMOQ)

-  Isolated Web Apps
    -  [https://github.com/WICG/isolated-web-apps/blob/main/Permissions.md](https://github.com/WICG/isolated-web-apps/blob/main/Permissions.md)
    -  [Chrome Platform Status](https://chromestatus.com/feature/5146307550248960)

-  Original Chrome Apps WebView artifacts
    -  [chrome.webviewTag](https://developer.chrome.com/docs/extensions/reference/webviewTag/)

-  More about Android WebView
    -  [Android security checklist: WebView | Oversecured Blog](https://blog.oversecured.com/Android-security-checklist-webview/)
    -  [WebView | Android Developers](https://developer.android.com/reference/android/webkit/WebView)
    -  [WebView security issues in Android applications](https://www.securing.pl/en/webview-security-issues-in-android-applications/)
    -  [Leakage of Sensitive Data Through Android Webviews | by Shiv Sahni | InfoSec Write-ups](https://infosecwriteups.com/leakage-of-sensitive-data-through-android-webviews-3b0b86486a28)

-  Other WebView implementations
    -  [Introduction to Microsoft Edge WebView2](https://learn.microsoft.com/en-us/microsoft-edge/webview2/)
    -  [`<webview>` Tag | Electron](https://www.electronjs.org/docs/latest/api/webview-tag)

-  A collection of native app-based web content embedding systems
    -  Chromium WebEngine [https://chromium.googlesource.com/chromium/src/+/HEAD/weblayer/README.md](https://chromium.googlesource.com/chromium/src/+/HEAD/weblayer/README.md)
    -  Android Custom Tabs [https://developer.chrome.com/docs/android/custom-tabs/](https://developer.chrome.com/docs/android/custom-tabs/)
    -  iOS View Controller [https://developer.apple.com/library/archive/featuredarticles/ViewControllerPGforiPhoneOS/index.html](https://developer.apple.com/library/archive/featuredarticles/ViewControllerPGforiPhoneOS/index.html)
