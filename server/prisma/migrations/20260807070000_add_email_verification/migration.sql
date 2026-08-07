ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- Grandfather in accounts that already existed before this feature shipped,
-- so nobody who already proved access to their inbox by registering/logging
-- in gets retroactively locked out of donating.
UPDATE "User" SET "emailVerified" = true;
