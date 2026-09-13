# API Documentation

Base URL: build-time `VITE_API_URL` (default `http://localhost:5000`). API responses are JSON. Most errors are `{ "error": "message" }`; no universal response envelope is implemented. Protected endpoints require the `token` httpOnly cookie.

## Auth

| Method/route | Auth | Request | Success / errors |
|---|---|---|---|
| POST `/api/auth/register` | First account public; later super admin cookie | `{email,password}` | `201 {success,message}`; 400 validation, 403, 400 duplicate |
| POST `/api/auth/login` | Public; auth limiter | `{email,password}` | `200 {success,admin}` + cookie; 400, 401, 423, 429 |
| POST `/api/auth/logout` | None | none | `200 {success,message}`, clears cookie |
| GET `/api/auth/me` | Admin | none | `200 {success,admin:{id,email,role}}`; 401 |
| POST `/api/auth/bootstrap` | Public only while no admin exists | `{email,password}` | `201 {success,admin}`; 400 `{errors:[]}`, 403, 500 |

Password must satisfy the route rules: 8+ chars, uppercase/lowercase/number/special and no spaces (login only requires a supplied password).

## Medicines and categories

| Method/route | Auth | Request/query | Response/errors |
|---|---|---|---|
| GET `/api/medicines` | Public | `search`, `category`, `sort=price_asc|price_desc` | array of medicine documents; 500 |
| GET `/api/medicines/:slug` | Public | slug or valid ObjectId | medicine; 404 |
| POST `/api/medicines` | `medicines` permission | medicine JSON | `201` medicine; 400, 409 |
| PUT `/api/medicines/:id` | `medicines` permission | partial/full medicine JSON | medicine; 400, 404 |
| DELETE `/api/medicines/:id` | `medicines` permission | none | `{message}`; 404 |
| GET `/api/categories` | Public | none | category array |
| POST `/api/categories` | `categories` permission | `{name,description?}` | `201` category; 400,409 |
| DELETE `/api/categories/:id` | `categories` permission | none | `{message}`; 404 |

Medicine create must include `slug`, `name`, and valid `variants`. A representative body is:

```json
{"slug":"example-tablet","name":"Example Tablet","category":"Antibiotic","images":["https://..."],"variants":[{"strength":"500 mg","form":"Tablet","packSize":"10","packagingType":"Box","price":12.5,"sku":"EX-500","stock":10}]}
```

## Public leads, orders, uploads

| Method/route | Auth | Request | Success/errors |
|---|---|---|---|
| POST `/api/inquiries` and `/api/inquiry` | Public; inquiry limiter | nested inquiry body below | `201 {success,message,inquiryId,referenceId}`; 400,404,429 |
| POST `/api/contact` | Public; inquiry limiter | `{name,email,message}` | `201 {success,message,id}`; 400,429 |
| POST `/api/orders` | Public | `{medicineId,customerName,customerEmail,customerPhone,quantity,notes}` | `201` order; 404/500 |
| GET `/api/orders` | Admin | none | order array with populated medicine; 401 |
| POST `/api/upload` | Admin | multipart field `image` | `{imageUrl}`; 500 |

Supported inquiry example:

```json
{"medicineId":"65...","customer":{"name":"Asha","city":"Pune","email":"a@example.com","phone":"+91 9999999999"},"product":{"quantity":1,"packagingType":"box","strength":"500 mg","brand":"Example"},"notes":"Please contact me"}
```

## Admin

| Method/route | Required access | Request/response |
|---|---|---|
| GET `/api/admin/dashboard` | `dashboard` permission | stats JSON |
| GET `/api/admin/categories/with-count` | `categories` permission | categories with `productCount` |
| GET `/api/admin/inquiries` | `inquiries` permission + role | query `page,limit,status,search,name,email,sort`; paged `{items,total,page,limit,hasMore}` |
| PUT `/api/admin/inquiries/:id/status` | same | `{status:new|contacted|closed}`; `{success,inquiry}` |
| GET `/api/admin/contact-messages` | inquiries permission + role | `page,limit,search`; paged result |
| PUT `/api/admin/contact-messages/:id/read` | same | `{success,message}` or 404 |
| GET `/api/admin/admins` | super admin | `{admins}` |
| POST `/api/admin/admins` and `/api/admin/create` | super admin | `{email,password}`; `201 {success,admin}` |
| DELETE `/api/admin/admins/:id` | super admin | `{success}`; 400/403/404 |
| POST `/api/admin/admins/transfer-ownership` | super admin | `{targetAdminId}`; `{success,newOwner}` |
| PUT `/api/admin/admins/:id/role` | super admin | `{role:admin|super_admin}`; `{success,admin}` |

GET `/api/health` is public and returns `{ok,uptime,timestamp,db}`. GET `/api/test/email` exists only outside production and requires admin authentication plus its own limiter. `PUT /api/admin/admins/:id/permissions` is **Not Implemented**, despite an admin UI caller.
