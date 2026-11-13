# PasswordX — Password Strength Analyzer

A responsive, client-side password strength checker and secure password generator. Designed for static hosting on GitHub Pages.

## Features

- Live strength score and visual meter
- Six-point security checklist
- Approximate crack-time estimate
- Common-password and simple-pattern warnings (small built-in list)
- Password generator using the browser Web Crypto API
- Configurable length and character sets
- Copy generated password
- Show/hide password
- Dark/light theme toggle
- Responsive layout and accessible labels
- No backend, account, analytics, or password storage

## Run locally

Open `index.html` in a modern browser. For the best clipboard support, run a local static server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy with GitHub Pages

1. Create a new repository on GitHub, for example `passwordx`.
2. Upload `index.html`, `styles.css`, `script.js`, and `README.md` to the repository root.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch **main** and folder **/(root)**, then click **Save**.
6. Wait for GitHub Pages to publish. Your site will be available at:
   `https://YOUR-USERNAME.github.io/passwordx/`

If your repository is named `YOUR-USERNAME.github.io`, the URL is:
`https://YOUR-USERNAME.github.io/`

## Security and accuracy notes

- Password analysis runs locally in the browser. The code does not transmit or persist the entered password.
- The common-password check uses a short illustrative list, not a comprehensive breach corpus. A password not flagged here is **not** guaranteed to be unique or uncompromised.
- Crack-time is a rough educational estimate based on a simplified assumed guessing rate of 10 billion guesses/second. Actual attack rates depend heavily on password hashing, salts, rate limits, attacker hardware, and attack strategy. Do not treat the displayed time as a security guarantee.
- The score is a heuristic, not a formal security certification. A long, unique passphrase generated/stored with a reputable password manager is recommended.
- GitHub Pages serves static files over HTTPS once published. Clipboard access is best supported in secure contexts (HTTPS or localhost).

## Customize

- Colors, spacing, and layout: `styles.css`
- Strength rules, generator, and estimate model: `script.js`
- Page content and structure: `index.html`

## License

You may use and modify this starter project for personal or educational projects.
