# ADR 003-provider-abstraction: Use provider adapters

## Status
Proposed

## Context
The MVP requires rapid delivery without sacrificing security, testability or future migration.

## Decision
Wrap identity, payments, email, storage, search and scanning so contracts and tests do not depend directly on one vendor.

## Consequences
Fewer moving parts initially, but clear interfaces, integration tests and ownership boundaries are mandatory.
