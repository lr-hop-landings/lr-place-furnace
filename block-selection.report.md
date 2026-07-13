# Block Selection Report

- Run: D:\works\projects\lr-place-furnace
- Project: lr-place-furnace
- Generated: 2026-07-13T14:56:44
- Library: D:\works\lr-wp-ai-agent\blocks-library
- Blocks: 17

## Summary

| # | Requested type | Component | Library type | Fit score | Selection risk | Match mode | Elements match | Manual fill | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | hero | hero-visual-price-01.astro | hero | 81 | low | exact | headline, accent, subline, cta, price-badge, pills | 0 | ok |
| 2 | contacts | social-links-cards-01.astro | contacts | 83 | low | exact | headline, subline, items | 0 | ok |
| 3 | quiz | lead-quiz-modal-01.astro | quiz | 85 | low | exact | manual | 0 | adapted and browser-verified |
| 4 | features | features-grid-icon-01.astro | features | 83 | low | exact | headline, subline, items | 0 | ok |
| 5 | features | materials-card-grid-01.astro | features | 85 | low | exact | headline, subline, items | 0 | ok |
| 6 | comparison | comparison-method-table-02.astro | comparison | 70 | low | exact | eyebrow, headline | 0 | ok |
| 7 | features | materials-card-grid-01.astro | features | 85 | low | exact | headline, subline, items | 0 | ok |
| 8 | features | equipment-process-02.astro | features | 70 | low | exact | eyebrow, headline | 0 | ok |
| 9 | pricing | pricing-service-table-02.astro | pricing | 72 | low | exact | eyebrow, headline, footnote | 0 | ok |
| 10 | cases | cases-emergency-slider-02.astro | cases | 67 | low | exact | headline, accent | 0 | ok |
| 11 | contacts | social-links-cards-01.astro | contacts | 83 | low | exact | headline, subline, items | 0 | ok |
| 12 | steps | steps-numbered-grid-01.astro | steps | 83 | low | exact | headline, subline, items | 0 | ok |
| 13 | trust-bar | trust-company-proof-02.astro | trust-bar | 81 | low | exact | eyebrow, headline, description, cta, phone | 0 | ok |
| 14 | guarantees | guarantee-certificate-01.astro | guarantees | 70 | low | exact | eyebrow, headline, subline, cta | 0 | ok |
| 15 | reviews | reviews-gallery-cards-01.astro | reviews | 85 | low | exact | headline, subline, items | 0 | ok |
| 16 | faq | faq-accordion-01.astro | faq | 83 | low | exact | headline, subline, items | 0 | ok |
| 17 | contacts | contact-form-card-01.astro | contacts | 77 | low | exact | headline, subline, cta, fields | 0 | ok |

## Selection Risks

- No component metadata warnings detected.


## 1. hero -> hero-visual-price-01.astro

- Library variant: visual-price
- Complexity: medium
- Audience: b2c, services, renovation, construction, roofing
- Tone: trustworthy, direct, professional
- Why this block fits: Главный экран с крупным оффером, визуалом услуги, ценовым или гарантийным бейджем, CTA и короткими trust-пунктами.
- Fit score: 81
- Selection risk: low
- Match mode: exact
- Compatibility: requested props headline, accent, subline, cta, ctaHref, priceBadge, pills; metadata elements headline, accent, subline, cta, price-badge, pills, image; matched headline, accent, subline, cta, price-badge, pills
- Props covered by known elements: headline, accent, subline, cta, price-badge, pills
- Tags: hero, price, guarantee, trust, visual, service
- Candidate shortlist:
  - hero/hero-visual-price-01: exact, score 81, matched headline, accent, subline, cta, price-badge, pills
  - hero/hero-emergency-video-02: exact, score 76, matched headline, accent, subline, cta, pills
  - hero/hero-video-urgent-01: exact, score 76, matched headline, accent, subline, cta, pills
- Alternatives considered:
  - hero/hero-emergency-static-02 (emergency-static): Статичный hero для срочных деликатных услуг с CTA, статистикой и плейсхолдером изображения.
  - hero/hero-emergency-video-02 (emergency-video): Главный экран для срочной чувствительной услуги: видео/плейсхолдер, сильный оффер, телефон, CTA и короткие маркеры доверия.
  - hero/hero-video-urgent-01 (video-urgent): Главный экран для срочных и эмоционально сложных услуг: видео или фоновое изображение, сильный оффер, акцентная строка, CTA и короткие trust-пункты.

## 2. contacts -> social-links-cards-01.astro

- Library variant: social-links-cards
- Complexity: simple
- Audience: b2c, services, emergency, high-trust
- Tone: direct, helpful, trustworthy
- Why this block fits: Карточки социальных сетей и мессенджеров с брендовыми цветами кнопок, подписью, ссылкой и реальными QR-кодами.
- Fit score: 83
- Selection risk: low
- Match mode: exact
- Compatibility: requested props title, subline, items; metadata elements headline, subline, items, social-links, brand-color-buttons, qr-images; matched headline, subline, items
- Props covered by known elements: headline, subline, items
- Tags: contacts, social, messengers, telegram, vk, max, qr, brand-colors
- Candidate shortlist:
  - contacts/social-links-cards-01: exact, score 83, matched headline, subline, items
  - contacts/contact-form-card-01: exact, score 73, matched headline, subline
  - cta-banner/cta-emergency-social-02: token, score 37, matched headline, text
- Alternatives considered:
  - contacts/contact-form-card-01 (gradient-form-card): Финальный контактный блок с большой CTA-карточкой и формой. Подходит для заявок, замеров, консультаций и расчета стоимости.

## 3. quiz -> lead-quiz-modal-01.astro

- Library variant: lead-modal
- Complexity: high
- Audience: b2c, services, leadgen, repair, cleaning
- Tone: interactive, commercial, helpful
- Why this block fits: CTA-блок с модальным многошаговым квизом для сбора заявки, первичной диагностики или расчета.
- Fit score: 50
- Selection risk: medium
- Match mode: exact
- Compatibility: requested props id, badge, headline, subline, triggerText, submitText, privacyText, steps; metadata elements quiz-cta, modal, multi-step-form, options, contact-fields, progress; matched none
- Props covered by known elements: none
- Tags: quiz, leadgen, modal, form, diagnostics, cta
- Candidate shortlist:
  - quiz/quiz-diagnostic-02: exact, score 59, matched headline
  - quiz/lead-quiz-modal-01: exact, score 85, adapted and browser-verified
- Alternatives considered:
  - quiz/quiz-diagnostic-02 (diagnostic-form): Квиз-диагностика для предварительной оценки заявки перед выездом специалиста.

## 4. features -> features-grid-icon-01.astro

- Library variant: icon-grid
- Complexity: simple
- Audience: b2c, b2b, services, renovation, construction
- Tone: trustworthy, expert, direct
- Why this block fits: Сетка преимуществ с иконками, заголовками и коротким объяснением. Подходит для аргументов доверия, гарантий, процесса и выгод.
- Fit score: 83
- Selection risk: low
- Match mode: exact
- Compatibility: requested props headline, subline, items; metadata elements headline, subline, items, icon, title, text; matched headline, subline, items
- Props covered by known elements: headline, subline, items
- Tags: features, benefits, icons, trust, advantages
- Candidate shortlist:
  - features/materials-card-grid-01: exact, score 85, matched headline, subline, items
  - features/benefits-emergency-grid-02: exact, score 83, matched headline, subline, items
  - features/features-grid-icon-01: exact, score 83, matched headline, subline, items
- Alternatives considered:
  - features/benefits-emergency-grid-02 (emergency-benefits-grid): Темная сетка преимуществ для деликатных и экстренных услуг: безопасность, документы, конфиденциальность и полный цикл работ.
  - features/benefits-glass-grid-01 (glass-grid): Темная сетка преимуществ с glass-карточками, хорошо подходит для сложных услуг, где нужно объяснить технологичность, документы, безопасность и полный цикл.
  - features/equipment-card-row-01 (equipment-row): Карточки оборудования, материалов или технологий. Нужен для объяснения профессионального арсенала без зависимости от слайдеров.

## 5. features -> materials-card-grid-01.astro

- Library variant: image-card-grid
- Complexity: medium
- Audience: b2c, services, products, renovation, construction
- Tone: expert, friendly, trustworthy
- Why this block fits: Карточная сетка с изображениями, описаниями и опциональными ценами. Подходит для материалов, услуг, тарифов, категорий работ или продуктовой витрины.
- Fit score: 85
- Selection risk: low
- Match mode: exact
- Compatibility: requested props headline, subline, items; metadata elements headline, subline, items, image, name, text, price; matched headline, subline, items
- Props covered by known elements: headline, subline, items
- Tags: materials, cards, services, prices, images, catalog
- Candidate shortlist:
  - features/materials-card-grid-01: exact, score 85, matched headline, subline, items
  - features/benefits-emergency-grid-02: exact, score 83, matched headline, subline, items
  - features/features-grid-icon-01: exact, score 83, matched headline, subline, items
- Alternatives considered:
  - features/benefits-emergency-grid-02 (emergency-benefits-grid): Темная сетка преимуществ для деликатных и экстренных услуг: безопасность, документы, конфиденциальность и полный цикл работ.
  - features/benefits-glass-grid-01 (glass-grid): Темная сетка преимуществ с glass-карточками, хорошо подходит для сложных услуг, где нужно объяснить технологичность, документы, безопасность и полный цикл.
  - features/equipment-card-row-01 (equipment-row): Карточки оборудования, материалов или технологий. Нужен для объяснения профессионального арсенала без зависимости от слайдеров.

## 6. comparison -> comparison-method-table-02.astro

- Library variant: method-comparison-table
- Complexity: low
- Audience: b2c, services, cleaning, emergency
- Tone: educational, expert, clear
- Why this block fits: Сравнительная таблица обычной уборки и профессиональной обработки по ключевым критериям.
- Fit score: 70
- Selection risk: low
- Match mode: exact
- Compatibility: requested props eyebrow, headline, rows; metadata elements eyebrow, headline, comparison-table, criteria; matched eyebrow, headline
- Props covered by known elements: eyebrow, headline
- Tags: comparison, table, method, cleaning, expertise
- Candidate shortlist:
  - comparison/comparison-table-01: exact, score 75, matched headline, rows
  - comparison/comparison-method-table-02: exact, score 70, matched eyebrow, headline
- Alternatives considered:
  - comparison/comparison-table-01 (bad-good-table): Сравнительная таблица: обычный рыночный подход против подхода компании. Хорошо снимает возражения и показывает отличие метода работы.

## 7. features -> materials-card-grid-01.astro

- Library variant: image-card-grid
- Complexity: medium
- Audience: b2c, services, products, renovation, construction
- Tone: expert, friendly, trustworthy
- Why this block fits: Карточная сетка с изображениями, описаниями и опциональными ценами. Подходит для материалов, услуг, тарифов, категорий работ или продуктовой витрины.
- Fit score: 85
- Selection risk: low
- Match mode: exact
- Compatibility: requested props headline, subline, items; metadata elements headline, subline, items, image, name, text, price; matched headline, subline, items
- Props covered by known elements: headline, subline, items
- Tags: materials, cards, services, prices, images, catalog
- Candidate shortlist:
  - features/materials-card-grid-01: exact, score 85, matched headline, subline, items
  - features/benefits-emergency-grid-02: exact, score 83, matched headline, subline, items
  - features/features-grid-icon-01: exact, score 83, matched headline, subline, items
- Alternatives considered:
  - features/benefits-emergency-grid-02 (emergency-benefits-grid): Темная сетка преимуществ для деликатных и экстренных услуг: безопасность, документы, конфиденциальность и полный цикл работ.
  - features/benefits-glass-grid-01 (glass-grid): Темная сетка преимуществ с glass-карточками, хорошо подходит для сложных услуг, где нужно объяснить технологичность, документы, безопасность и полный цикл.
  - features/equipment-card-row-01 (equipment-row): Карточки оборудования, материалов или технологий. Нужен для объяснения профессионального арсенала без зависимости от слайдеров.

## 8. features -> equipment-process-02.astro

- Library variant: equipment-process
- Complexity: low
- Audience: b2c, services, cleaning, emergency
- Tone: expert, process-oriented, clear
- Why this block fits: Процессный блок об оборудовании: показывает, как инструменты встроены в диагностику, обработку и контроль.
- Fit score: 70
- Selection risk: low
- Match mode: exact
- Compatibility: requested props eyebrow, headline, items; metadata elements eyebrow, headline, process-cards, numbered-items; matched eyebrow, headline
- Props covered by known elements: eyebrow, headline
- Tags: features, equipment, process, tools, cleaning
- Candidate shortlist:
  - features/benefits-emergency-grid-02: exact, score 83, matched eyebrow, headline, items
  - features/benefits-glass-grid-01: exact, score 80, matched eyebrow, headline, cards
  - features/equipment-slider-02: exact, score 75, matched eyebrow, headline
- Alternatives considered:
  - features/benefits-emergency-grid-02 (emergency-benefits-grid): Темная сетка преимуществ для деликатных и экстренных услуг: безопасность, документы, конфиденциальность и полный цикл работ.
  - features/benefits-glass-grid-01 (glass-grid): Темная сетка преимуществ с glass-карточками, хорошо подходит для сложных услуг, где нужно объяснить технологичность, документы, безопасность и полный цикл.
  - features/equipment-card-row-01 (equipment-row): Карточки оборудования, материалов или технологий. Нужен для объяснения профессионального арсенала без зависимости от слайдеров.

## 9. pricing -> pricing-service-table-02.astro

- Library variant: service-price-table
- Complexity: low
- Audience: b2c, services, cleaning, emergency
- Tone: transparent, practical, commercial
- Why this block fits: Табличный блок цен для услуг с пояснением факторов, влияющих на итоговую стоимость.
- Fit score: 72
- Selection risk: low
- Match mode: exact
- Compatibility: requested props eyebrow, headline, footnote, items; metadata elements eyebrow, headline, price-rows, service-details, footnote; matched eyebrow, headline, footnote
- Props covered by known elements: eyebrow, headline, footnote
- Tags: pricing, price-list, services, table, cost
- Candidate shortlist:
  - pricing/pricing-service-table-02: exact, score 72, matched eyebrow, headline, footnote
  - pricing/packages-emergency-cards-02: exact, score 70, matched eyebrow, headline
  - pricing/pricing-accordion-01: exact, score 70, matched headline, items
- Alternatives considered:
  - pricing/packages-emergency-cards-02 (emergency-packages): Три пакетных предложения для срочных услуг с выделенным рекомендуемым сценарием.
  - pricing/packages-three-cards-01 (three-packages): Три тарифных или сервисных пакета с рекомендацией, списком включенных работ и CTA.
  - pricing/pricing-accordion-01 (category-accordion): Аккордеон прайса по категориям услуг. Подходит для длинных списков работ, где важно показать порядок цен и не перегрузить страницу.

## 10. cases -> cases-emergency-slider-02.astro

- Library variant: emergency-slider
- Complexity: medium
- Audience: b2c, services, emergency, cleaning
- Tone: proof-driven, empathetic, expert
- Why this block fits: Слайдер кейсов для сложных услуг: ситуация, ход решения и итог без раскрытия персональных данных.
- Fit score: 67
- Selection risk: low
- Match mode: exact
- Compatibility: requested props eyebrow, headline, accent, subline, items; metadata elements headline, accent, case-cards, image, meta, situation, solution-list, result; matched headline, accent
- Props covered by known elements: headline, accent
- Tags: cases, emergency, cleaning, proof, problem-solution, after-death
- Candidate shortlist:
  - cases/cases-emergency-slider-02: exact, score 67, matched headline, accent
  - cases/cases-problem-solution-01: exact, score 67, matched headline, accent
  - portfolio/before-after-cards-01: token, score 40, matched headline, subline, cards
- Alternatives considered:
  - cases/cases-problem-solution-01 (problem-solution): Кейсы в формате ситуация → решение → результат. Заменяет абстрактные отзывы конкретными доказательствами работы.

## 11. contacts -> social-links-cards-01.astro

- Library variant: social-links-cards
- Complexity: simple
- Audience: b2c, services, emergency, high-trust
- Tone: direct, helpful, trustworthy
- Why this block fits: Карточки социальных сетей и мессенджеров с брендовыми цветами кнопок, подписью, ссылкой и реальными QR-кодами.
- Fit score: 83
- Selection risk: low
- Match mode: exact
- Compatibility: requested props title, subline, items; metadata elements headline, subline, items, social-links, brand-color-buttons, qr-images; matched headline, subline, items
- Props covered by known elements: headline, subline, items
- Tags: contacts, social, messengers, telegram, vk, max, qr, brand-colors
- Candidate shortlist:
  - contacts/social-links-cards-01: exact, score 83, matched headline, subline, items
  - contacts/contact-form-card-01: exact, score 73, matched headline, subline
  - cta-banner/cta-emergency-social-02: token, score 37, matched headline, text
- Alternatives considered:
  - contacts/contact-form-card-01 (gradient-form-card): Финальный контактный блок с большой CTA-карточкой и формой. Подходит для заявок, замеров, консультаций и расчета стоимости.

## 12. steps -> steps-numbered-grid-01.astro

- Library variant: numbered-grid
- Complexity: simple
- Audience: b2c, services, renovation, construction
- Tone: trustworthy, direct
- Why this block fits: Нумерованная сетка этапов процесса. Подходит для объяснения работы, снятия неопределенности и показа прозрачного сценария.
- Fit score: 83
- Selection risk: low
- Match mode: exact
- Compatibility: requested props headline, subline, items; metadata elements headline, subline, items, number, title, text; matched headline, subline, items
- Props covered by known elements: headline, subline, items
- Tags: steps, process, how-it-works, workflow, trust
- Candidate shortlist:
  - steps/steps-numbered-grid-01: exact, score 83, matched headline, subline, items
  - steps/protocol-alternating-timeline-01: exact, score 75, matched headline, subline
  - steps/protocol-safety-timeline-02: exact, score 60, matched headline
- Alternatives considered:
  - steps/protocol-alternating-timeline-01 (alternating-timeline): Вертикальный протокол работ с чередующимися карточками. Подходит для технологичных услуг, где важен регламент и ощущение контроля.
  - steps/protocol-safety-timeline-02 (safety-protocol): Вертикальный протокол работ для объяснения последовательности действий на чувствительном объекте.

## 13. trust-bar -> trust-company-proof-02.astro

- Library variant: company-proof-split
- Complexity: medium
- Audience: b2c, services, cleaning, emergency, sensitive-services
- Tone: confident, formal, calm
- Why this block fits: Доверительный блок о компании с доказательствами, CTA и изображением или нейтральным плейсхолдером.
- Fit score: 81
- Selection risk: low
- Match mode: exact
- Compatibility: requested props eyebrow, headline, description, proofs, ctaLabel, ctaHref, phone; metadata elements eyebrow, headline, description, proof-list, cta, phone, image-placeholder; matched eyebrow, headline, description, cta, phone
- Props covered by known elements: eyebrow, headline, description, cta, phone
- Tags: trust, proof, company, documents, team, cta
- Candidate shortlist:
  - trust-bar/trust-company-proof-02: exact, score 81, matched eyebrow, headline, description, cta, phone
  - trust-bar/trust-bar-pills-01: exact, score 58, matched none
  - guarantees/guarantee-certificate-01: token, score 39, matched eyebrow, headline, subline, cta
- Alternatives considered:
  - trust-bar/trust-bar-pills-01 (metric-pills): Компактная полоса доверия с цифрами, гарантиями, опытом или короткими фактами в карточках.

## 14. guarantees -> guarantee-certificate-01.astro

- Library variant: certificate
- Complexity: medium
- Audience: b2c, services, repair, cleaning, high-trust
- Tone: trustworthy, official, calm
- Why this block fits: Блок гарантий в виде официального сертификата: обязательства, итоговое обещание, подпись или ответственный и CTA.
- Fit score: 70
- Selection risk: low
- Match mode: exact
- Compatibility: requested props eyebrow, headline, subline, items, summaryTitle, summaryText, cta, ctaHref; metadata elements eyebrow, headline, subline, guarantee-items, summary, author, cta; matched eyebrow, headline, subline, cta
- Props covered by known elements: eyebrow, headline, subline, cta
- Tags: guarantees, trust, certificate, documents, official, cta
- Candidate shortlist:
  - guarantees/guarantee-certificate-01: exact, score 70, matched eyebrow, headline, subline, cta
  - guarantees/guarantees-service-obligations-02: exact, score 58, matched eyebrow, headline
- Alternatives considered:
  - guarantees/guarantees-service-obligations-02 (service-obligations-grid): Сетка гарантий и обязательств компании перед началом работ.

## 15. reviews -> reviews-gallery-cards-01.astro

- Library variant: image-cards
- Complexity: medium
- Audience: b2c, services, renovation, construction
- Tone: trustworthy, friendly
- Why this block fits: Карточки отзывов с фото результата, цитатой, деталями проекта и автором. Подходит для социального доказательства.
- Fit score: 85
- Selection risk: low
- Match mode: exact
- Compatibility: requested props headline, subline, items; metadata elements headline, subline, items, quote, meta, text, author, image; matched headline, subline, items
- Props covered by known elements: headline, subline, items
- Tags: reviews, social-proof, case, photo, trust
- Candidate shortlist:
  - reviews/reviews-gallery-cards-01: exact, score 85, matched headline, subline, items
- Alternatives considered:
  - none in the current local library for this type

## 16. faq -> faq-accordion-01.astro

- Library variant: accordion
- Complexity: simple
- Audience: b2c, b2b, services, renovation, construction
- Tone: trustworthy, expert, friendly
- Why this block fits: FAQ-аккордеон для снятия частых возражений: цена, сроки, материалы, гарантии, ответственность.
- Fit score: 83
- Selection risk: low
- Match mode: exact
- Compatibility: requested props headline, subline, items; metadata elements headline, subline, items, question, answer; matched headline, subline, items
- Props covered by known elements: headline, subline, items
- Tags: faq, accordion, objections, questions, trust
- Candidate shortlist:
  - faq/faq-accordion-01: exact, score 83, matched headline, subline, items
  - faq/faq-sensitive-accordion-02: exact, score 60, matched headline
- Alternatives considered:
  - faq/faq-sensitive-accordion-02 (sensitive-accordion): FAQ-аккордеон для деликатных сервисов с понятными ответами до выезда.

## 17. contacts -> contact-form-card-01.astro

- Library variant: gradient-form-card
- Complexity: simple
- Audience: b2c, b2b, services
- Tone: direct, friendly, trustworthy
- Why this block fits: Финальный контактный блок с большой CTA-карточкой и формой. Подходит для заявок, замеров, консультаций и расчета стоимости.
- Fit score: 77
- Selection risk: low
- Match mode: exact
- Compatibility: requested props headline, subline, cta, action, fields; metadata elements headline, subline, fields, cta, form; matched headline, subline, cta, fields
- Props covered by known elements: headline, subline, cta, fields
- Tags: contacts, form, lead, cta, callback
- Candidate shortlist:
  - contacts/contact-form-card-01: exact, score 77, matched headline, subline, cta, fields
  - contacts/social-links-cards-01: exact, score 65, matched headline, subline
  - cta-banner/cta-emergency-social-02: token, score 35, matched headline, text, cta
- Alternatives considered:
  - contacts/social-links-cards-01 (social-links-cards): Карточки социальных сетей и мессенджеров с брендовыми цветами кнопок, подписью, ссылкой и реальными QR-кодами.

