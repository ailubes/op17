-- CreateEnum
CREATE TYPE "AdminEventType" AS ENUM ('USER_CREATED', 'USER_UPDATED', 'USER_ROLES_UPDATED', 'USER_DEACTIVATED', 'USER_REACTIVATED', 'USER_PASSWORD_RESET_LINK', 'USER_INVITE_LINK', 'USER_LOGIN', 'USER_LOGOUT', 'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED', 'VARIANT_CREATED', 'VARIANT_UPDATED', 'VARIANT_DELETED', 'VARIANT_STOCK_UPDATED', 'ORDER_STATUS_UPDATED', 'ORDER_TRACKING_ADDED', 'ORDER_NOTE_ADDED', 'REFUND_CREATED', 'REFUND_UPDATED', 'CATEGORY_CREATED', 'CATEGORY_UPDATED', 'CATEGORY_DELETED', 'COLLECTION_CREATED', 'COLLECTION_UPDATED', 'COLLECTION_DELETED', 'PROMO_CODE_CREATED', 'PROMO_CODE_UPDATED', 'PROMO_CODE_DELETED');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
ALTER TYPE "RoleName" ADD VALUE 'CUSTOMER';

-- AlterEnum
ALTER TYPE "ShippingCarrier" ADD VALUE 'NOVA_POST_GLOBAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ShippingMethod" ADD VALUE 'NOVA_POST_POSTOMAT';
ALTER TYPE "ShippingMethod" ADD VALUE 'NOVA_POST_GLOBAL_COURIER';
ALTER TYPE "ShippingMethod" ADD VALUE 'NOVA_POST_GLOBAL_BRANCH';
ALTER TYPE "ShippingMethod" ADD VALUE 'NOVA_POST_GLOBAL_DOOR';

-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "validatedAddress" JSONB,
ADD COLUMN     "validationStatus" TEXT;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "carrierTrackingUrl" TEXT,
ADD COLUMN     "customsDeclaration" JSONB,
ADD COLUMN     "novaPostGlobalRef" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpires" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AdminEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "type" "AdminEventType" NOT NULL,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminEvent_actorId_idx" ON "AdminEvent"("actorId");

-- CreateIndex
CREATE INDEX "AdminEvent_targetUserId_idx" ON "AdminEvent"("targetUserId");

-- CreateIndex
CREATE INDEX "AdminEvent_type_idx" ON "AdminEvent"("type");

-- CreateIndex
CREATE INDEX "AdminEvent_createdAt_idx" ON "AdminEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "AdminEvent" ADD CONSTRAINT "AdminEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminEvent" ADD CONSTRAINT "AdminEvent_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
