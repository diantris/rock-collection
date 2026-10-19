-- V6: global settings for the public site (roadmap step 4); always exactly one row, created by the app with defaults

CREATE TABLE publish_settings (
    id                INT PRIMARY KEY CHECK (id = 1),
    fields            VARCHAR(32)[] NOT NULL DEFAULT '{}', -- PublishField names that are published
    intro             TEXT,                                -- text at the top of the public index page
    last_published_at TIMESTAMPTZ,
    last_commit       VARCHAR(40)                          -- sha of the last publish commit in the Pages repo
);
