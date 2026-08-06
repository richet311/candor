-- AlterEnum
BEGIN;
CREATE TYPE "OAuthProvider_new" AS ENUM ('GOOGLE', 'GITHUB');
ALTER TABLE "OAuthAccount" ALTER COLUMN "provider" TYPE "OAuthProvider_new" USING ("provider"::text::"OAuthProvider_new");
ALTER TYPE "OAuthProvider" RENAME TO "OAuthProvider_old";
ALTER TYPE "OAuthProvider_new" RENAME TO "OAuthProvider";
DROP TYPE "OAuthProvider_old";
COMMIT;
