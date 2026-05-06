## Plan: Kopo Kopo integration + Admin Payment Monitor

### 1. Database changes (migration)
- New table `kopokopo_transactions`: `id, donation_id, k2_payment_id (unique), reference, amount, currency, msisdn, status (pending/completed/failed), raw_callback jsonb, gateway_event_id (unique, nullable), created_at, updated_at`. RLS: anyone insert, admins manage, allow select for status polling via edge function only.
- New table `webhook_logs`: `id, provider (pesaflux/kopokopo), event_type, payload jsonb, signature_valid bool, processed bool, error text, donation_id, created_at`. RLS: admins only.
- Add `payment_provider` column to `donations` (`pesaflux` default, `kopokopo`).
- Enable realtime on `kopokopo_transactions` and `webhook_logs`.

### 2. Secrets (already configured by user)
`K2_CLIENT_ID, K2_CLIENT_SECRET, K2_BASE_URL, K2_API_KEY, K2_TILL_NUMBER` — verified in screenshot.

### 3. Edge functions
- **`kopokopo-stk`**: OAuth client_credentials → POST `/api/v2/incoming_payments` with subscriber, amount, till_number, callback_url pointing to `kopokopo-webhook`. Inserts pending row into `kopokopo_transactions`.
- **`kopokopo-webhook`**: Verifies `X-KopoKopo-Signature` (HMAC-SHA256 with `K2_API_KEY`). Handles both incoming-payment-result callback and `buygoods_transaction_received` events. Idempotent via `gateway_event_id`. Updates `kopokopo_transactions` + `donations`. Logs to `webhook_logs`.
- **`kopokopo-status`**: Service-role status sync — GETs incoming payment from K2 API, syncs DB. Mirrors `pesaflux-status`.
- **`payment-retry`** (admin-only, JWT verified): Accepts `{ donationId, provider }` → re-queries gateway and syncs status, used by admin "Retry" button.
- Update `pesaflux-webhook` to also write to `webhook_logs`.

### 4. Frontend — donation flow
- `DonationForm.tsx`: Add provider switcher (PesaFlux / Kopo Kopo) shown only when payment method is `mpesa`. Persist to form state.
- `Donate.tsx`: Pass selected provider into save + payment step. Route to either `StkPaymentForm` (existing) or new `KopoKopoPaymentForm`.
- New `KopoKopoPaymentForm.tsx`: same UX shape as `StkPaymentForm` (sending → waiting → completed/failed, countdown, manual check, realtime + visibility polling) but invokes `kopokopo-stk` and subscribes to `kopokopo_transactions`.

### 5. Admin Payment Monitor
- New page `src/components/admin/AdminPaymentMonitor.tsx` with 3 tabs:
  1. **Live Transactions**: combined PesaFlux + Kopo Kopo with realtime subscription, filters (status, provider), columns (amount, phone, reference, status, age, provider).
  2. **Webhook Logs**: from `webhook_logs` (provider, event_type, signature_valid, processed, error, time).
  3. **Stuck Payments**: pending > 2 minutes — each row has **Retry** button calling `payment-retry`.
- Add tab to `AdminDashboard.tsx`.

### Technical notes
- Kopo Kopo OAuth token cached in-memory per cold start (1h TTL).
- All edge functions use shared CORS headers and structured error logs.
- Signature verification: `crypto.subtle` HMAC-SHA256, hex compare, constant-time.
- Idempotency: `ON CONFLICT (gateway_event_id) DO NOTHING`.

Shall I proceed?