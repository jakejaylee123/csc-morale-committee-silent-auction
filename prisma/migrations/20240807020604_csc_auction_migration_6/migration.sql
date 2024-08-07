BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Item] ADD [disqualificationReason] NVARCHAR(1000),
[disqualified] BIT NOT NULL CONSTRAINT [Item_disqualified_df] DEFAULT 0,
[disqualifiedBy] INT;

-- AddForeignKey
ALTER TABLE [dbo].[Item] ADD CONSTRAINT [Item_disqualifiedBy_fkey] FOREIGN KEY ([disqualifiedBy]) REFERENCES [dbo].[Bidder]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
