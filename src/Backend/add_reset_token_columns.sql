-- Add reset token columns to TherapistsLogin table
-- This migration adds the missing columns needed for password reset functionality

-- Add reset_token column
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'TherapistsLogin' 
    AND COLUMN_NAME = 'reset_token'
)
BEGIN
    ALTER TABLE TherapistsLogin ADD reset_token NVARCHAR(255) NULL;
END

-- Add reset_token_expiry column
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'TherapistsLogin' 
    AND COLUMN_NAME = 'reset_token_expiry'
)
BEGIN
    ALTER TABLE TherapistsLogin ADD reset_token_expiry DATETIME NULL;
END

PRINT 'Reset token columns added successfully to TherapistsLogin table'; 