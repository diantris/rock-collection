-- V12: the address of the public site's message box (the owner's Google Apps Script web app, which saves messages
-- in their Google Sheet). Empty means the specimen pages have no message box.

ALTER TABLE publish_settings ADD COLUMN message_url TEXT;
