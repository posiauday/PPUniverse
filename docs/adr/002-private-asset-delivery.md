# ADR 002-private-asset-delivery: Use private asset delivery

## Status
Proposed

## Context
The MVP requires rapid delivery without sacrificing security, testability or future migration.

## Decision
Store uploads privately, quarantine and scan, authorize at request time, then issue short-lived signed delivery.

## Consequences
Fewer moving parts initially, but clear interfaces, integration tests and ownership boundaries are mandatory.
