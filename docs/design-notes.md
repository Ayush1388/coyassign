# Design notes

Measurements and principles taken from the live Coy web app (app.getcoy.com) and used as the starting point for Discover. The README explains what was kept and what was deliberately changed.

# Design Map

## Spacing Scale
8 · 10 · 14 · 16 · 22 (most used) · 28 · 40 px. Container padding `0 20px 40px`. Layout via flex `gap`.

## Font Hierarchy
Family: **Bricolage Grotesque** (variable 200–800), used for every role.
- h1: 44px / 800 / line-height 1.02 / tracking −0.035em
- h2: 32px / 800 · h3: 24px / 800
- lede: 19px / 400 / line-height 1.45, max-width ~394px
- button: 17px / 700 / tracking −0.01em
- body: 16px / 400 · fine print and labels: 14px / 600
- micro-label: ~12px / 700, uppercase, tracking ~0.08em ("YOUR REFERRAL CODE")

## Color Palette
- `#FFFFFF` page · `#15121D` ink (text, edges, shadows) · `#6D6979` muted text
- `#FF3D81` pink: primary CTA fill (ink label) · `#D81E63` pink text actions · `#FFE4EF` pink-soft: active nav, icon chips
- `#F6F4FA` soft surface (list rows) · `#ECE9F2` hairline
- Tints: `#FFE45C` yellow (teaser) · `#E7E0FF` lilac (status) · `#CBF4E0` mint (reward) · `#D7ECFF` sky · `#FFE1CF` peach

## Image Ratios
No photography. 1:1 emoji tiles (~44px, radius ~12px) stand in for illustration.

## Component Tokens
- Edge `2px solid #15121D` · Pop `3px 3px 0 #15121D` (hero cards ~5px)
- Radius: 999px pills · 24px hero cards · 20px cards · 16px inputs and code boxes · 10px small buttons
- Primary CTA: 54px tall, pill, pink fill, ink 17px/700 label, edge + pop
- Press: translate(3px,3px) and the shadow collapses over 0.08s
- Grid: 1 column, max-width 480px, gutter 20px

---

# Taste DNA

### Sticker physics over soft elevation
- **Trigger**: They needed a depth language for a nervous, playful romance product.
- **Decision**: A single hard ink shadow (`3px 3px 0 #15121D`) plus a 2px ink edge, over blurred rgba shadows and borderless floating cards.
- **Reason**: Sharing a crush is anxiety-inducing. Objects that look like printed stickers make it feel like a game, not an inbox.
- **Evidence**: `--pop` and `--edge` are the only depth tokens. Press is transform plus box-shadow over 0.08s. Hero cards push to ~5px.

### One voice, four weights
- **Trigger**: They had to set type for display, body, buttons and inputs.
- **Decision**: Bricolage Grotesque at 800/700/600/400 everywhere, over a display font paired with a neutral body sans.
- **Reason**: The copy is written like a friend talking ("It's also how your crushes find you"). One family keeps the voice from switching registers between headline and fine print.
- **Evidence**: 22 of 23 text samples use Bricolage. h1 is 44px/800/−0.035em and body is 19px/400 in the same family.

### Surface colour names the moment
- **Trigger**: They had several card types stacked in one column.
- **Decision**: A fixed pastel per meaning (yellow teaser, lilac status, mint reward), over uniform white cards separated by headings.
- **Reason**: In a single column, colour is the fastest way to tell news-about-you from a task or a reward, before reading a word.
- **Evidence**: 5 named tint tokens. Pink-soft is reserved for active and icon states. The page itself stays `#FFF`.

### Phone-shaped even on a monitor
- **Trigger**: The viewport is 1440px wide.
- **Decision**: A 480px centred column, over a responsive desktop layout with sidebars or multiple columns.
- **Reason**: Coy is opened from Instagram story links. Desktop gets the same intimate layout rather than a diluted dashboard.
- **Evidence**: `max-width: 480px`, `padding: 0 20px 40px`, and a full-width 440px pill CTA at a 1440px viewport.
