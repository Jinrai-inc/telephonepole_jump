-- AlterTable: Rename stripe_customer_id to square_customer_id
ALTER TABLE "organizations" RENAME COLUMN "stripe_customer_id" TO "square_customer_id";
