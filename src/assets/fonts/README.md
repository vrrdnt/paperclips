# Log font

IBM Plex Mono Regular is vendored from [IBM Plex](https://github.com/IBM/plex/tree/78cd4223d8de9fcb78cba84eadecb269c56093c5/packages/plex-mono),
`fonts/complete/woff2/IBMPlexMono-Regular.woff2`, without modification.

It is distributed under the [SIL Open Font License 1.1](../../../public/licenses/ibm-plex-mono.txt).
The license is also included in the built site's `/licenses/ibm-plex-mono.txt`.

The HTML preload and CSS reference the same Vite asset so the service worker can
precache the font for offline use, including on an existing installation.
