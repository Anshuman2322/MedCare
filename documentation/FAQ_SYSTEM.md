# FAQ system

One knowledge base feeds the `/faq` page, the support chat and (when
`ANTHROPIC_API_KEY` is set) the Claude prompt.

| Piece | File |
|---|---|
| Entries and categories (edit here) | `server/data/faq.js` |
| Matcher (typo-tolerant, Hinglish-aware) | `server/services/chat/faq.js` |
| Chat wiring, emergency / fallback rules | `server/services/chat/engine.js`, `safety.js` |
| API | public: `GET /api/faq`, `GET /api/faq/search?q=`, `POST /api/faq/:id/feedback`; admin: `/api/admin/faq/entries`, `/api/admin/faq/questions`, `/api/admin/faq/summary` |
| Page | `client/src/pages/FAQ.jsx` (+ `components/faq/TopFaqs.jsx` on About and Contact) |

## Managing it from the admin panel (FAQ & Chat Answers)

- **Asked by visitors**: every question typed into the chat (and every FAQ-page search that
  found nothing), with how the FAQ handled it (answered / needs the team / only close
  matches / no answer), how many times it was asked, which FAQ answered it, and a link to the
  chat it came from. The sidebar badge counts questions that still need an answer.
  "Add answer" turns a question into a FAQ entry (marked resolved automatically).
- **Answers**: all entries with 👍/👎 counts. Edit any answer, hide it, add new ones, or
  restore a built-in answer to its original text. Changes are live within about 15 seconds
  on the FAQ page, in the chat and in the Claude prompt.
- Same permission as Support Chat (`inquiries`). Emails and phone numbers a visitor types are
  masked before saving, and emergencies / health statements are never logged.
- Stored in MongoDB: `faqquestions` (visitor questions), `faqentries` (team edits and
  additions), `faqfeedbacks` (votes). The built-in answers stay in `server/data/faq.js`.

## Changing the built-in answers in code

1. Edit or add an `entry(...)` in `server/data/faq.js` (id, category, question,
   answer, `alt` = other ways to ask it, `kw` = keywords, `p` = priority 1-10,
   `related`, `links`, `escalate: true` if the chat should also offer a person).
2. Set `published: false` to hide an entry without deleting it.
3. Run `cd server && npm test` and deploy. (An answer edited in the admin panel wins over the code.)

## Rules the content must follow

- Only state what the public site already says. No prices, delivery dates, shipping
  charges, stock, payment methods, refunds or prescription rules that the team has not
  published (a test blocks dollar amounts and "X-Y days" promises in the built-in answers).
- When there is no published policy, say so and point to the team.
- Nothing medical: no diagnosis, product recommendation or dose.
