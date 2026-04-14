# Edison Website MVP

This repository currently contains a dependency-light MVP for Edison personal website.

## Pages

- `index.html` - Start page with four symbolic entry objects
- `about.html` - formal profile, experience, and project sections
- `blog.html` - blog list/detail view powered by local post data
- `contact.html` - profile links and friends section
- `mail.html` - anonymous mail MVP with topic selection and local submission storage

## Run Locally

Use a simple static server from the repository root:

```powershell
python -m http.server 3000
```

Then open `http://localhost:3000`.

## Notes

- Blog data lives in `scripts/posts.js`
- Shared interactions live in `scripts/site.js`
- Shared styling lives in `styles/site.css`
- Mail submission is front-end only in this MVP and stores recent submissions in browser `localStorage`
