# ADR 001-modular-monolith: Use a modular monolith for MVP

## Status
Proposed

## Context
The MVP requires rapid delivery without sacrificing security, testability or future migration.

## Decision
Lower operational complexity while retaining explicit domain boundaries and extraction seams.

## Consequences
Fewer moving parts initially, but clear interfaces, integration tests and ownership boundaries are mandatory.
