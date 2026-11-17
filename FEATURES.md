# Part A: Two core features Coy should have

> Based on using app.getcoy.com end to end: phone OTP login, adding a crush, email verification, the invite/share link ("Someone has a crush on you", valid for 30 days) and the extra-slots screen (3 free slots, then ₹49 / ₹129 / ₹199 packs or "invite 3 friends for a free slot").

Coy's promise is simple: **tell Coy who you like; if they like you back, you both find out, otherwise nobody ever knows.** Both features below protect that promise where I think it is weakest today: a crush only works if Coy can actually *find the right person*, and slots are scarce, so every wasted slot hurts.

---

## 1. Multi-identifier crushes: "find them however you know them"

### What

When adding a crush, let me identify them by **any** of: phone number, email, or **Instagram handle**. Optionally, let me pick them from my contacts. On the other side, every user can attach several *verified* identifiers to their own account: phone via OTP (already exists), email (already exists), and Instagram via a one-time code DM'd to the handle or placed in the bio.

A crush matches if **any** identifier I entered matches **any** verified identifier on their account.

### Why it's needed

- **Missed matches are silent failures.** Today I have to know the *exact* phone number or email my crush signed up with. If I add their old number, their college email or a typo, a real mutual crush **never** resolves. Neither of us will ever know it failed, which is the worst possible outcome for this product. Coy already hints at this problem with the "Add your email, so people who only have your email can find you" card. This feature generalises that fix.
- **It matches how people actually know each other.** Coy spreads through Instagram stories (the share sheet literally says "add it to your story with a Link sticker"). Many college crushes are "I know their @, not their number." Supporting handles meets users where the product already grows.
- **Slots are scarce and paid.** With 3 free slots and ₹49+ per extra slot, wasting a slot on a wrong identifier feels like losing money. That damages trust and conversion.

### Privacy design (the important part)

- Contact sync and identifier matching use **salted hashes** (normalised E.164 phone or lower-cased email/handle), never plaintext lists, and the server never stores my contact book.
- No "is this person on Coy?" lookups are exposed to the client. Adding a crush always looks identical whether or not the person exists, to prevent enumeration.
- Instagram verification only proves *ownership*. Coy never posts, reads DMs or shows the handle to anyone except a mutual match.

### Success metric

The mutual-match rate per crush added should go up, and the share of crushes stuck at "not found" for more than 7 days should go down.

---

## 2. Slot lifecycle and safety controls

### What

Give each crush slot a lifecycle and give everyone safety controls:

1. **Status without a reveal.** Each crush shows a neutral status: *Heads-up sent* → *They're on Coy*. This never shows "they saw it" or "they didn't like you back"; it only says whether Coy can reach them.
2. **Swap or expire slots.** I can swap a crush out (with a cooldown, so people can't cycle through everyone to probe). Optionally, a crush auto-expires after N days, so the slot is freed instead of dying. Expired or removed crushes are deleted, not archived.
3. **Recipient controls.** Anyone who receives an anonymous "someone has a crush on you" heads-up can tap **"Stop these"** to opt out of future anonymous notifications. Rate limits apply per sender and per recipient. There is also a report option for harassment.

### Why it's needed

- **Dead slots feel like lost money.** If my crush never joins, the slot is effectively gone forever. A clear lifecycle and swaps keep paying users happy and make the paid packs feel fair instead of extractive. That likely *improves* conversion on the extra-slots screen.
- **Anonymous messages to arbitrary phone numbers are an abuse vector.** Without opt-out and rate limits, the same mechanism that makes Coy delightful can be used to spam or unsettle someone ("someone has a crush on you" sent repeatedly to an ex). One viral story about misuse could damage the brand's core trust. Building safety in early is far cheaper than retrofitting it after an incident.
- **Recipients are tomorrow's users.** A respectful heads-up experience with an easy opt-out makes recipients more likely to sign up, not less.

### Privacy guardrails

- Status is coarse and identical for "hasn't joined" versus "joined but didn't add you", so it can never leak one-sided feelings.
- The swap cooldown and caps stop people using swaps to binary-search who likes them.

---

### Other ideas I considered (shorter list)

- **Mutual-match next step:** a time-boxed, in-app "say hi" thread after a match, so the moment doesn't die in awkwardness.
- **Discover (Part B):** opt-in discovery of new people within your college or city, kept separate from the crush list. I built this as the take-home.
- **Reminder before the share link expires** (it's valid for 30 days), to re-share and re-engage.
