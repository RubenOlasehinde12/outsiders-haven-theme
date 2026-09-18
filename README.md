# Outsiders Haven — Custom Shopify Theme

A custom Shopify theme I hand-coded in Liquid, HTML, CSS and JavaScript for my own clothing brand, **Outsiders Haven**. Instead of using a pre-made template, I built the theme from scratch so I could control the layout, styling and shopping experience around the brand.

**Live site:** [www.outsidershaven.com](https://www.outsidershaven.com)

## About the project

I run Outsiders Haven as part of a small team, and I own the technical build. This repo is the code behind the live storefront — the sections, templates, styling and JavaScript that make up the theme. Shopify handles the platform side (checkout, hosting, payments); everything in here is the front-end theme I wrote on top of it.

## Tech

- **Liquid** — Shopify's templating language (sections, snippets, templates)
- **HTML5 & CSS** — one stylesheet (`assets/base.css`), no CSS framework
- **JavaScript** — vanilla JS (`assets/theme.js`), no libraries
- **Shopify** — theme architecture, Cart AJAX API, predictive search

## What it does

- **AJAX cart** — add to cart, update quantities and remove items without reloading the page, using Shopify's Cart API (`cart.js`, `cart/add.js`, `cart/change.js`); the cart drawer and item count update live.
- **Slide-out drawers** — a shared drawer system for the cart, search and mobile menu, with a background scrim and scroll lock.
- **Predictive search** — search results as you type.
- **Sticky header** — transparent over the homepage hero, turns solid on scroll.
- **Theme settings** — colours, fonts, page width and spacing are driven by CSS variables generated from Shopify theme settings (`snippets/oh-vars.liquid`), so the look can be changed from the theme editor without touching code. Every value has a fallback so an unset setting never breaks the design.
- **Members / password page** — a custom gated page used for members-only drops.
- **Responsive** — works across mobile and desktop, with a dedicated mobile menu.
- **Accessibility touches** — skip-to-content link, `aria-hidden` handling on drawers, keyboard-friendly.

## Project structure

```
assets/      base.css, theme.js, logo
blocks/      reusable content blocks
config/      theme settings
layout/      theme.liquid (main wrapper), password.liquid
locales/     text / translations
sections/    page sections (hero, slideshow, collage, product, cart, header, footer…)
snippets/    reusable partials (cart drawer, product card, icons, mobile menu, oh-vars)
templates/   page templates + customer account pages
```

## How I used AI

I used AI as a learning tool while building this, not as a shortcut. When I hit something I didn't know yet — how a particular Shopify Liquid object worked, the right way to call the Cart AJAX API, or how to structure a section — I'd prompt it for the specific piece of information I needed, then read it, understand it, and write and adapt the code myself. The goal was to fill the gaps in what I knew and keep learning as I went, while staying in control of the design decisions and the final code.

## Notes

This is a Shopify theme, so it runs inside a Shopify store rather than as a standalone site. The code here is the full theme; product data and images are stored in the Shopify store itself, so some image references in the code point to files hosted on Shopify.
