-- MVP-020, docs/final-decisions.md "MVP-020 open questions 46, 47 and 48"
-- (question 48, 2026-09-22): one additive UserRole value for the admin
-- surface the story requires. Nothing else about UserRole, or any other part
-- of MVP-002's identity schema, changes. No application code path (route,
-- server action, seed, environment variable, or test helper) assigns this
-- value — it is granted only by a manual operator action directly against
-- the database.
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ADMIN';
