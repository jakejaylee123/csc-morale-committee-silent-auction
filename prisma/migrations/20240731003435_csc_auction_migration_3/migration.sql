/*
  Warnings:

  - You are about to drop the `Administration` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Event] ALTER COLUMN [updatedAt] DATETIME2 NULL;
ALTER TABLE [dbo].[Event] ALTER COLUMN [updatedBy] INT NULL;
ALTER TABLE [dbo].[Event] ALTER COLUMN [deletedAt] DATETIME2 NULL;
ALTER TABLE [dbo].[Event] ALTER COLUMN [deletedBy] INT NULL;

-- DropTable
DROP TABLE [dbo].[Administration];

-- CreateTable
CREATE TABLE [dbo].[AdministrationAssignment] (
    [id] INT NOT NULL IDENTITY(1,1),
    [bidderId] INT NOT NULL,
    CONSTRAINT [AdministrationAssignment_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AdministrationAssignment_bidderId_key] UNIQUE NONCLUSTERED ([bidderId])
);

-- AddForeignKey
ALTER TABLE [dbo].[AdministrationAssignment] ADD CONSTRAINT [AdministrationAssignment_bidderId_fkey] FOREIGN KEY ([bidderId]) REFERENCES [dbo].[Bidder]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
