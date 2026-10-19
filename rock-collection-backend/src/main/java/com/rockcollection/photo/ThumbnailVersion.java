// ThumbnailVersion.java - When a specimen's thumbnail last changed (query projection, no image bytes)
package com.rockcollection.photo;

import java.time.Instant;

public record ThumbnailVersion(Long specimenId, Instant updatedAt) {}
