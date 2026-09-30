# adapters/payments

Stripe adapter (ADR 003, ADR 004). MVP-007 slice 1 contains `StripeWebhookVerifier`, which implements `@ppu/domain-commerce`'s `PaymentWebhookVerifier` using Stripe's official library (`stripe`, pinned at 22.6.2). There is no Stripe API client, no API key and no webhook route yet: the route and fulfilment belong to MVP-008, and Checkout Session creation is MVP-007 slice 3.
