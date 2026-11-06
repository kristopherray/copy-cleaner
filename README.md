# Copy Cleaner

Copy text, open **Copy Clean** in Raycast, and press **Return** on a preview to replace the clipboard with the full result.

| Option | Behavior |
| --- | --- |
| File-Safe Name | Makes a lowercase filename stem. For example, `Résumé / Launch—Plan` becomes `resume-launch-plan`. Keeps underscores and non-Latin letters and limits the stem to 255 UTF-8 bytes. Search for the old name, **URL Safe String**, to find it too. |
| Sentence Case | Capitalizes sentence and line starts and lowercases the remaining letters, including acronyms. |
| Lowercase | Lowercases the text and preserves spacing. |
| Capitalize Words | Capitalizes each word and lowercases its remaining letters. Handles accents and contractions. |
| Remove Formatting (Plain Text) | Copies the text representation without rich formatting. Preserves whitespace and literal markup. |
| Remove Emojis | Removes whole emoji sequences, including families, flags, and keycaps. |
| Remove HTML Tags | Extracts readable text from HTML, decodes entities, and separates paragraphs, lines, and table cells. |

If the clipboard contains no text, copy some text and reopen the command. A transformation that produces an empty string has no copy action.

## Rebuild or reinstall locally

Open Raycast v2. With Node.js 22.22.2 or newer, run these commands from the root of this repository.

```sh
npm ci
npm test
npm run dev
```

Once the build succeeds, press **Ctrl-C**. Raycast keeps **Copy Clean** installed. Run `npm run dev` again after editing the source. [Raycast development guide](https://developers.raycast.com/basics/create-your-first-extension)
