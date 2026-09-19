# Log font

The log uses the bundled IBM Plex Mono Regular font from
[IBM Plex](https://github.com/IBM/plex/tree/78cd4223d8de9fcb78cba84eadecb269c56093c5/packages/plex-mono),
`fonts/complete/woff2/IBMPlexMono-Regular.woff2`, without modification.

It is distributed under the [SIL Open Font License 1.1](../../../public/licenses/ibm-plex-mono.txt).
The license is also included in the built site's `/licenses/ibm-plex-mono.txt`.

`index.html` preloads the same file that `src/styles/index.css` uses in its
`@font-face` rule. Vite gives both references the same built asset URL. The service
worker caches it for offline use, including after an existing installation loads
the updated app. Keep the license notice with the font when maintaining this asset.
