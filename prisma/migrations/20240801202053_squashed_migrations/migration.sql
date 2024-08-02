/*
  Warnings:

  - You are about to drop the column `deleted` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `deletedBy` on the `Event` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Event] DROP CONSTRAINT [Event_deleted_df];
ALTER TABLE [dbo].[Event] DROP COLUMN [deleted],
[deletedAt],
[deletedBy];
ALTER TABLE [dbo].[Event] ADD [disabledAt] DATETIME2,
[disabledBy] INT,
[enabled] BIT NOT NULL CONSTRAINT [Event_enabled_df] DEFAULT 0;

-- AddForeignKey
ALTER TABLE [dbo].[Event] ADD CONSTRAINT [Event_disabledBy_fkey] FOREIGN KEY ([disabledBy]) REFERENCES [dbo].[Bidder]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
