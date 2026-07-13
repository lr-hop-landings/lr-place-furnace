# Hero visual enhancement — design specification

Date: 2026-07-13  
Status: approved visual direction; awaiting written-spec review  
Scope: block 01 only (`hero-visual-price-01.astro`)

## Objective

Strengthen the current “engineering clarity” style without changing the brand language or the meaning of the block. The hero must immediately communicate the service, show a believable installation context, and lead to one dominant action: requesting an installation estimate.

## Fixed decisions

- Preserve the current warm off-white, deep blue, orange, and steel palette.
- Keep Manrope and the current calm, expert tone.
- Preserve the headline, accent, supporting copy, phone number, CTA target, and all four benefit facts.
- Retain the existing component API and its blueprint fallback.
- Use a generated photorealistic installation image as the primary visual.
- Desktop uses a two-column composition; mobile places the visual before the copy.
- Moderate composition changes are allowed; no content is removed.

## Information hierarchy

The content order is:

1. Service eyebrow (`priceBadge`).
2. Main service headline and geographic accent.
3. Short explanatory paragraph.
4. Primary estimate CTA and secondary phone action.
5. Four compact facts describing applicability and scope.
6. Installation visual with three technical callouts: wall protection, chimney, and base.

The estimate CTA is the only filled orange action. The phone remains prominent but visually secondary. The media/lightbox may remain interactive, but it must not compete with the estimate CTA.

## Desktop composition

Breakpoint: wider than 820 px.

- Keep the content and media in a two-column grid, approximately 57% / 43%.
- Limit the text measure so the headline reads as a deliberate 4–5-line composition rather than filling the entire column.
- Use a subtle blueprint-dot texture only behind the left content area. It must not reduce text contrast.
- Present the four facts as a compact two-column group. Replace the current heavy pill treatment with light surfaces, a thin blue rule, and a small orange confirmation marker.
- Place the media in a rounded portrait-oriented frame with a restrained soft shadow.
- Overlay three small technical callouts on the image. Callout lines and labels must remain readable at 1024 px.
- Maintain generous space above and below the hero while keeping the first CTA visible in a typical 900–1000 px-high desktop viewport.

## Mobile composition

Breakpoint: 820 px and narrower.

- Put the media first, followed by the content.
- Crop the same source image intentionally with `object-fit: cover`; do not stretch it.
- Shorten only visual line lengths, not the copy itself.
- Make the primary CTA full-width.
- Center the phone action below the CTA.
- Preserve all four facts in a compact one-column list on narrow phones and a two-column grid when space allows.
- Keep the total first-screen composition free of horizontal overflow at 360, 390, and 430 px widths.

## Generated image direction

Create one documentary-style, photorealistic scene of a correctly installed freestanding metal stove in a real wooden or mixed-material country-house interior. The image must visibly include:

- a dark steel stove;
- a metal chimney section;
- a protected wall zone;
- a non-combustible base or floor protection;
- warm natural side light and realistic construction materials.

The image must not contain people, logos, brand marks, UI text, watermarks, decorative fireplaces, impossible pipe joints, exposed fire outside the stove, or unsafe proximity between hot surfaces and combustible materials. Technical labels are rendered in HTML/CSS, not baked into the image.

Target composition: portrait or near-square master with sufficient negative space around the stove for responsive cropping and callouts. Store the optimized web asset under `public/images/` with a descriptive filename. Provide a concise Russian `alt` describing the installation scene.

## Component and data boundaries

- Primary component: `src/components/hero/hero-visual-price-01.astro`.
- Page integration: `src/pages/index.astro` passes `imageSrc` and `imageAlt` through the existing props object.
- Asset: one generated and web-optimized image under `public/images/`.
- No new runtime dependency.
- No changes to quiz logic, global navigation, social links, or blocks 02–17.
- The existing CSS blueprint remains the no-image fallback.

## Styling and motion

- Continue using existing design tokens and component-scoped CSS.
- Reduce the visual weight of the badge and benefit facts.
- Tighten the headline letter spacing and use a slightly more editorial line-height while preserving readability.
- Use one restrained initial reveal for the copy and media. CSS-only motion is preferred.
- Under `prefers-reduced-motion: reduce`, remove entrance transforms and transitions.
- Hover and focus states must be visible for the CTA, phone, badge, and media link.

## Accessibility

- Keep exactly one `h1`.
- Preserve semantic anchors for the estimate CTA and telephone number.
- Use a meaningful Russian `alt` for the generated image.
- Decorative texture and purely decorative lines are hidden from assistive technology.
- Callout text has sufficient contrast and does not depend on color alone.
- Keyboard focus remains clearly visible.

## Fallback behavior

If `imageSrc` is absent, the component renders the existing blueprint scene. The fallback must receive the same final frame sizing and responsive layout as the generated image so the hero remains usable without the asset.

## Verification

Run and verify:

- `npm run build`;
- `npm run check`;
- the project-required `npx graphify hook-rebuild` after code modification;
- desktop screenshot at 1440 px wide;
- mobile screenshot at 390 px wide.

Manual checks:

- CTA links to `#estimate-quiz`;
- phone link remains `tel:+78123444444`;
- all four benefit facts remain present;
- image and blueprint fallback both render correctly;
- no horizontal overflow at 360–430 px;
- primary CTA is visible without excessive scrolling on desktop;
- text remains readable over all decorative backgrounds;
- focus states and reduced-motion behavior work.

## Acceptance criteria

The block is complete when the generated scene looks believable, the hero preserves all current meaning, the CTA hierarchy is unambiguous, desktop and mobile screenshots match the approved composition, and the verification checks pass without introducing regressions outside block 01.
