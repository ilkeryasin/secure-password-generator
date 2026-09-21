# Secure Password Generator Chrome Extension

A small Manifest V3 Chrome extension that generates passwords locally using the Web Crypto API.

## Features

- Cryptographically secure random generation with `crypto.getRandomValues()`
- Rejection sampling to avoid modulo bias
- 8–2048 character password length with slider and direct numeric input
- Uppercase, lowercase, numbers and symbols
- Customizable symbol set with a built-in default (`!@#$%^&*()-_=+[]{};:,.?`)
- Custom symbol set is persisted with the other settings in `chrome.storage.local`
- Duplicate symbols, letters, numbers and whitespace are removed from the custom set
- One-click reset back to the default symbol set
- Optional exclusion of visually similar characters (`O`, `0`, `I`, `l`, `1`)
- Guarantees at least one character from every enabled character group
- Secure Fisher–Yates shuffle
- Password strength estimate based on character-pool entropy
- One-click copy
- Remembers generator settings via `chrome.storage.local`
- Never stores generated passwords
- No backend and no network permission

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- Google Chrome or another Chromium browser supporting Manifest V3

## Development

```bash
npm install
npm run build
```

The production extension is generated under `dist/`.

## Load into Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the generated `dist` folder.
6. Pin **Secure Password Generator** from Chrome's Extensions menu if desired.

After source changes, run `npm run build` again and click the extension's **Reload** button in `chrome://extensions`.

## Architecture

```text
src/
├── core/
│   ├── PasswordGenerator.ts
│   ├── PasswordOptions.ts
│   └── PasswordStrength.ts
├── storage/
│   └── SettingsRepository.ts
└── popup/
    ├── main.ts
    └── styles.css
public/
├── manifest.json
└── icons/
```

`core` has no dependency on Chrome APIs. Browser-specific persistence lives under `storage`, while popup behavior remains under `popup`.

## Security notes

- Password generation uses `crypto.getRandomValues()`, not `Math.random()`.
- Generated passwords are not persisted.
- The extension requests only the `storage` permission.
- No host permissions are requested.
- No data is sent over the network.
