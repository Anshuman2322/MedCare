# Feature Catalogue

| Feature | Purpose/flow | Related files | Dependencies/business value |
|---|---|---|---|
| Medicine catalogue | Public list/filter/sort/detail; API reads Mongo or JSON fallback | `client/pages/ShopByCategory.jsx`, `MedicineDetails.jsx`, `server/medicineController.js` | Mongo/Mongoose; makes products discoverable |
| Product variants | Captures strength/form/pack/price/stock per medicine | `Medicine.js`, `MedicineForm.jsx` | Mongoose; supports quotation choices |
| Inquiry modal | Sends valid nested customer/product lead to API, stores lead, returns reference | `InquiryModal.jsx`, `inquiryController.js` | Mongo, Resend/Twilio optional; lead generation |
| Inquiry wizard | Multi-step route UI | `InquiryWizardPage.jsx` | API contract mismatch currently limits business operation |
| Contact messages | Public message stored; admins list/read it | `Contact.jsx`, `contactController.js`, `Messages.jsx` | Mongo; general lead handling |
| Admin auth | Cookie login, lockout, guarded SPA/API | `AuthContext.jsx`, `auth.controller.js`, `auth.middleware.js` | JWT/bcrypt; restricts operations |
| Admin catalog management | CRUD medicines/categories and dashboard counts | admin pages, controllers/routes | Mongo/Cloudinary; operational catalogue management |
| Admin lead management | Paginated/filterable enquiries/messages and status/read updates | `Inquiries.jsx`, `Messages.jsx`, admin controllers | Mongo; follow-up workflow |
| Administrator management | Super-admin creates/deletes/admin-role transfers | `AdminManagement.jsx`, `adminUser.controller.js` | Mongo transactions; ownership control |
| Image upload | Admin browser unsigned upload; server authenticated upload endpoint | `ImageUploader.jsx`, `uploadRoute.js` | Cloudinary; media management |
| Notifications | New inquiry sends email and optional WhatsApp best effort | `sendEmail.js`, `inquiryController.js` | Resend/Twilio; faster follow-up |
| Local UX preferences | Currency and wishlist browser persistence | `useStore.jsx`, `wishlist.js` | localStorage; convenience only |

Not Implemented: checkout/payment, cart, customer profile/order history, replies to contact messages, notification retries/queue, permissions update endpoint, and server-managed wishlist.
