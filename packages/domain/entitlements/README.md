# domain/entitlements

Entitlement domain rules per `docs/06-data-model.md`, including "download requires
active entitlement or explicit free-product policy." **Free path owned by MVP-010**
(FR-005: `Entitlement`, `Download`) — implemented here. Paid sources (`ORDER_LINE`,
`ADMIN_GRANT`, `SUBSCRIPTION`), `EntitlementGrant`, `Subscription`/`SubscriptionItem`,
and the signed-delivery entities (`ReleaseFile`, `SignedDownloadGrant`, FR-007) remain
owned by MVP-007/008/009, not yet built.
