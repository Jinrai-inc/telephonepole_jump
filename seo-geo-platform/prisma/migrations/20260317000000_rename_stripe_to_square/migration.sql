-- AlterTable: Rename stripe_customer_id to payjp_customer_id
ALTER TABLE "organizations" RENAME COLUMN "stripe_customer_id" TO "payjp_customer_id";
