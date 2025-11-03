-- DropForeignKey
ALTER TABLE "public"."Tier" DROP CONSTRAINT "Tier_tierListId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TierItem" DROP CONSTRAINT "TierItem_tierId_fkey";

-- AddForeignKey
ALTER TABLE "Tier" ADD CONSTRAINT "Tier_tierListId_fkey" FOREIGN KEY ("tierListId") REFERENCES "TierList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierItem" ADD CONSTRAINT "TierItem_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
