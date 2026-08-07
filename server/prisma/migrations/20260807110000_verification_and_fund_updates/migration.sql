-- VerificationStatus enum + Organization verification workflow fields
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

ALTER TABLE "Organization" ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED';
ALTER TABLE "Organization" ADD COLUMN "verificationRequestedAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "verificationRejectionReason" TEXT;

-- Backfill: orgs already marked verified (the seeded nonprofits) should reflect that in the
-- new status field too, rather than everyone starting at UNVERIFIED regardless of history.
UPDATE "Organization" SET "verificationStatus" = 'VERIFIED' WHERE "verified" = true;

-- FundUpdate: dated progress notes an org can post against one of its own funds
CREATE TABLE "FundUpdate" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundUpdate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FundUpdate_fundId_idx" ON "FundUpdate"("fundId");

ALTER TABLE "FundUpdate" ADD CONSTRAINT "FundUpdate_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FundUpdate" ADD CONSTRAINT "FundUpdate_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
