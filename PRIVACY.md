# Privacy Policy for Nimbus Markdown

Effective date: October 19, 2026

Nimbus Markdown is an open-source browser extension maintained in the [dvgamerr-app/nimbus-markdown repository](https://github.com/dvgamerr-app/nimbus-markdown). Its purpose is to render local and user-authorized remote Markdown documents in your browser.

## Information the extension handles

### Document content and addresses

The extension reads Markdown content, the current document URL, and its content type to detect and render supported documents. Rendering takes place in your browser. Document content is not uploaded to a developer-operated server for processing.

Local files are accessible only after you enable “Allow access to file URLs” in your browser's extension settings. Remote site access is controlled through permissions you grant to the extension.

The extension does not maintain a general log of your browsing history. It does use document URLs to detect Markdown and identify saved reading positions, as described below.

### Preferences and permitted sites

The extension stores preferences using `chrome.storage.sync`. These include theme choices, rendering options, custom theme CSS, and configured site rules, including origin addresses and matching patterns. Your browser may synchronize these settings through its sync service when synchronization is enabled. Actual browser permission grants are managed separately by the browser.

### Reading positions

To restore your place in a document, the extension saves document and table-of-contents scroll positions. Storage keys include the document's origin and pathname, which may identify a website or local file path. These values are stored in the document's `localStorage` when available, with `chrome.storage.local` as a fallback. They are not intentionally synchronized through `chrome.storage.sync`.

Values stored in a remote document's `localStorage` are associated with that website's origin and may be accessible to other scripts running on the same origin under the browser's storage rules.

### Automatic reload and network information

Automatic reload checks supported documents for changes by reading them again. For remote documents, this can make additional requests to the document's server.

When the optional `webRequest` permission is granted, the extension observes completed document requests within the access allowed by the browser. It uses the destination IP address to distinguish loopback addresses, such as `127.0.0.1` and `::1`, from remote servers and adjust reload behavior. This information is not used to determine your geographic location or create an analytics profile.

## External connections

Nimbus Markdown is not entirely offline in every configuration:

- Opening or refreshing a remote Markdown document contacts the server hosting that document.
- When emoji rendering is enabled, recognized emoji shortcodes are converted into image URLs hosted at `https://cdn.jsdelivr.net/emojione/assets`. Loading those images contacts jsDelivr.
- Images, styles, or other external resources referenced by a rendered document may contact their respective hosts, subject to browser restrictions and rendering settings.
- Browser settings synchronization is handled by your browser's sync provider.

External resource providers receive ordinary network request information, such as your connection IP address and requested resource address. Depending on browser policies, requests may also include referrer information or other standard request metadata. Their handling of this information is governed by their own privacy policies. Nimbus Markdown does not send the complete Markdown document to the emoji CDN as an upload.

## How information is used and shared

Information is used to detect and display Markdown, apply your preferences, restore reading positions, manage site access, and refresh previews.

Nimbus Markdown does not include a developer-operated analytics or advertising service. It does not sell user data, use it for personalized advertising, use or transfer it for purposes unrelated to the extension's single purpose, or use or transfer it to determine creditworthiness or for lending purposes. External connections and browser synchronization are described above.

The use of information received from Google APIs will adhere to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data), including the Limited Use requirements.

## Permissions

- **storage:** Saves preferences, site rules, custom themes, and reading positions using browser storage.
- **scripting:** Detects Markdown documents and inserts the packaged rendering scripts and styles into documents the extension is allowed to access.
- **Local file access:** Reads local Markdown documents when file URL access is enabled by you.
- **Optional website access:** Enables rendering on websites you authorize.
- **Optional webRequest:** Supports automatic reload by observing completed document requests and destination IP information.

## Retention and your choices

Preferences and reading positions remain in their respective browser storage until changed or cleared. There is no developer-operated database retaining your Markdown documents.

You can change rendering options, disable emoji or automatic reload, remove configured sites, revoke site permissions, or disable local file access. You can also turn off browser synchronization or uninstall the extension.

Uninstalling the extension removes its extension-owned local storage according to browser behavior. Reading positions saved in a document origin's `localStorage` may remain until you clear that origin's site data. Synced settings are subject to your browser provider's synchronization and deletion controls.

## Changes to this policy

This policy may be updated when the extension's behavior changes. The effective date at the top identifies the current version. Material changes to data handling will be reflected in this policy and the extension's store disclosures.

## Contact

For privacy questions, contact the maintainers through the [project's GitHub issues](https://github.com/dvgamerr-app/nimbus-markdown/issues). Issues are public; do not post private document content, credentials, or other sensitive information.
