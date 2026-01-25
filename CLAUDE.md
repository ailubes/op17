# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` - Install dependencies
- `npm run dev` - Start dev server on http://localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server

## Environment

Set `GEMINI_API_KEY` in `.env.local` for Gemini API access.

## Architecture

This is a Next.js (App Router) + React 19 + TypeScript personal website/landing page for Oleh Plotnytskyi (Ukrainian Thunder athlete branding).

**Project Structure:**
- `app/layout.tsx` - Root layout + global font links + metadata
- `app/page.tsx` - Home page (renders `App.tsx`)
- `app/shop/page.tsx` - Shop page (client component)
- `App.tsx` - Main home composition with scroll reveal animation logic (client)
- `components/` - Page sections (Navbar, Hero, About, CareerTimeline, Stats, Gallery, Videos, ShopPreview, TrophyBanner, Footer)

**Styling:**
- Tailwind CSS via PostCSS (`tailwind.config.cjs`, `postcss.config.cjs`)
- Global styles + custom utilities in `app/globals.css`
- Custom colors: `ukraine-blue`, `ukraine-dark`, `gold`, `slate-950`
- Custom fonts: Bebas Neue, Barlow Condensed, Inter
- Custom utility classes: `.clip-hero`, `.clip-tag`, `.clip-btn`, `.outline-text`, `.noise`

**Path Alias:**
- `@/*` maps to project root
