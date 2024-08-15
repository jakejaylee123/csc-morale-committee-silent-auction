BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Event] ADD [releaseWinners] BIT NOT NULL CONSTRAINT [Event_releaseWinners_df] DEFAULT 0;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
