-- Adds a third role for the person who runs Candor itself (not an org admin, not a donor).
-- No account can self-register into this role; it's granted by running
-- scripts/promoteToOwner.ts against an existing account.
ALTER TYPE "Role" ADD VALUE 'OWNER';
