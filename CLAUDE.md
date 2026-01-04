# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` - Install dependencies
- `npm run dev` - Start dev server on http://localhost:3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment

Set `GEMINI_API_KEY` in `.env.local` for Gemini API access.

## Architecture

This is a React 19 + Vite + TypeScript personal website/landing page for Oleh Plotnytskyi (Ukrainian Thunder athlete branding).

**Project Structure:**
- `index.html` - Entry point with Tailwind CDN config and custom CSS
- `index.tsx` - React root mount
- `App.tsx` - Main component with scroll reveal animation logic
- `components/` - Page sections (Navbar, Hero, About, CareerTimeline, Stats, Gallery, Videos, ShopPreview, TrophyBanner, Footer)

**Styling:**
- Tailwind CSS via CDN (configured inline in `index.html`)
- Custom colors: `ukraine-blue`, `ukraine-dark`, `gold`, `slate-950`
- Custom fonts: Bebas Neue, Barlow Condensed, Inter
- Custom utility classes: `.clip-hero`, `.clip-tag`, `.clip-btn`, `.outline-text`, `.noise`

**Path Alias:**
- `@/*` maps to project root
