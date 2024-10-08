BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Bidder] (
    [id] INT NOT NULL IDENTITY(1,1),
    [displayName] NVARCHAR(1000) NOT NULL,
    [firstName] NVARCHAR(1000) NOT NULL,
    [lastName] NVARCHAR(1000) NOT NULL,
    [windowsId] NVARCHAR(1000) NOT NULL,
    [enabled] BIT NOT NULL,
    [enabledAt] DATETIME2,
    [enabledBy] INT,
    [disabledAt] DATETIME2,
    [disabledBy] INT,
    [updatedAt] DATETIME2,
    [updatedBy] INT,
    [emailAddress] NVARCHAR(1000),
    CONSTRAINT [Bidder_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AdministrationAssignment] (
    [id] INT NOT NULL IDENTITY(1,1),
    [bidderId] INT NOT NULL,
    CONSTRAINT [AdministrationAssignment_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AdministrationAssignment_bidderId_key] UNIQUE NONCLUSTERED ([bidderId])
);

-- CreateTable
CREATE TABLE [dbo].[Event] (
    [id] INT NOT NULL IDENTITY(1,1),
    [description] NVARCHAR(1000) NOT NULL,
    [startsAt] DATETIME2 NOT NULL,
    [endsAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL,
    [createdBy] INT NOT NULL,
    [updatedAt] DATETIME2,
    [updatedBy] INT,
    [releaseWinners] BIT NOT NULL CONSTRAINT [Event_releaseWinners_df] DEFAULT 0,
    [enabled] BIT NOT NULL CONSTRAINT [Event_enabled_df] DEFAULT 0,
    [disabledAt] DATETIME2,
    [disabledBy] INT,
    CONSTRAINT [Event_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CategoryCode] (
    [id] INT NOT NULL IDENTITY(1,1),
    [prefix] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [CategoryCode_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CategoryCode_prefix_key] UNIQUE NONCLUSTERED ([prefix]),
    CONSTRAINT [CategoryCode_description_key] UNIQUE NONCLUSTERED ([description])
);

-- CreateTable
CREATE TABLE [dbo].[Item] (
    [id] INT NOT NULL IDENTITY(1,1),
    [eventId] INT NOT NULL,
    [itemNumber] INT NOT NULL,
    [itemDescription] NVARCHAR(1000) NOT NULL,
    [minimumBid] DECIMAL(32,16),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Item_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [createdBy] INT NOT NULL,
    [updatedAt] DATETIME2 CONSTRAINT [Item_updatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedBy] INT,
    [categoryId] INT NOT NULL,
    [disqualified] BIT NOT NULL CONSTRAINT [Item_disqualified_df] DEFAULT 0,
    [disqualificationReason] NVARCHAR(1000),
    [disqualifiedBy] INT,
    CONSTRAINT [Item_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Bid] (
    [id] INT NOT NULL IDENTITY(1,1),
    [eventId] INT NOT NULL,
    [bidderId] INT NOT NULL,
    [itemId] INT NOT NULL,
    [bidAmount] DECIMAL(32,16) NOT NULL,
    [createdAt] DATETIME2 NOT NULL,
    [createdBy] INT NOT NULL,
    [disqualified] BIT NOT NULL,
    [disqualifiedAt] DATETIME2,
    [disqualifiedBy] INT,
    CONSTRAINT [Bid_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Bidder] ADD CONSTRAINT [Bidder_enabledBy_fkey] FOREIGN KEY ([enabledBy]) REFERENCES [dbo].[Bidder]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Bidder] ADD CONSTRAINT [Bidder_disabledBy_fkey] FOREIGN KEY ([disabledBy]) REFERENCES [dbo].[Bidder]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Bidder] ADD CONSTRAINT [Bidder_updatedBy_fkey] FOREIGN KEY ([updatedBy]) REFERENCES [dbo].[Bidder]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AdministrationAssignment] ADD CONSTRAINT [AdministrationAssignment_bidderId_fkey] FOREIGN KEY ([bidderId]) REFERENCES [dbo].[Bidder]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Event] ADD CONSTRAINT [Event_disabledBy_fkey] FOREIGN KEY ([disabledBy]) REFERENCES [dbo].[Bidder]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Item] ADD CONSTRAINT [Item_eventId_fkey] FOREIGN KEY ([eventId]) REFERENCES [dbo].[Event]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Item] ADD CONSTRAINT [Item_createdBy_fkey] FOREIGN KEY ([createdBy]) REFERENCES [dbo].[Bidder]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Item] ADD CONSTRAINT [Item_updatedBy_fkey] FOREIGN KEY ([updatedBy]) REFERENCES [dbo].[Bidder]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Item] ADD CONSTRAINT [Item_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[CategoryCode]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Item] ADD CONSTRAINT [Item_disqualifiedBy_fkey] FOREIGN KEY ([disqualifiedBy]) REFERENCES [dbo].[Bidder]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Bid] ADD CONSTRAINT [Bid_eventId_fkey] FOREIGN KEY ([eventId]) REFERENCES [dbo].[Event]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Bid] ADD CONSTRAINT [Bid_bidderId_fkey] FOREIGN KEY ([bidderId]) REFERENCES [dbo].[Bidder]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Bid] ADD CONSTRAINT [Bid_itemId_fkey] FOREIGN KEY ([itemId]) REFERENCES [dbo].[Item]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Bid] ADD CONSTRAINT [Bid_createdBy_fkey] FOREIGN KEY ([createdBy]) REFERENCES [dbo].[Bidder]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Bid] ADD CONSTRAINT [Bid_disqualifiedBy_fkey] FOREIGN KEY ([disqualifiedBy]) REFERENCES [dbo].[Bidder]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
