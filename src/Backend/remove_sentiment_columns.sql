-- SQL Script to Remove Unnecessary Sentiment Columns from ProcessingJobs Table
-- Run this in SQL Server Management Studio or your SQL client

-- Remove the sentiment-related columns that are no longer needed
-- since sentiment analysis is now done on-demand in the Patient Dashboard

ALTER TABLE ProcessingJobs
DROP COLUMN SentimentStatus;

ALTER TABLE ProcessingJobs
DROP COLUMN SentimentError;

-- Optional: Also remove the general ErrorMessage column since we have TranscriptionError
-- (Uncomment the line below if you want to remove this too)
-- ALTER TABLE ProcessingJobs
-- DROP COLUMN ErrorMessage;

-- Optional: Remove SessionID if not being used
-- (Uncomment the line below if you want to remove this too)
-- ALTER TABLE ProcessingJobs
-- DROP COLUMN SessionID;

-- Verify the changes
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'ProcessingJobs'
ORDER BY ORDINAL_POSITION;
