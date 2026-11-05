# Family Archive

Private family photo archive built with Next.js. Photos live in a Google Drive folder, and the app syncs them into a browsable gallery.

## Features

- Google sign-in through Firebase Authentication
- Drive sync into Firestore through a Next.js API route
- Automatic grouping of original, colorized and enhanced versions of one photo, based on file name suffixes (`_colorized`, `_color`, `_enhanced`)
- Gallery built on `react-photo-album`
- Admin and upload pages, plus an image proxy route

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Firebase (Auth, Firestore), Google Drive API.

## Run locally

```bash
npm install
npm run dev
```

The app needs your own Firebase project and Google Drive credentials in `.env.local`.

Live demo: https://family-iota-steel.vercel.app
