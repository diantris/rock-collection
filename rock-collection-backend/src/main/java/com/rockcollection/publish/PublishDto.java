// PublishDto.java - API representations of the publish settings and of a publish run
package com.rockcollection.publish;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public final class PublishDto {
    private PublishDto() {}

    /** One checkbox in the Publish dialog. */
    public record Field(PublishField key, String label, String group, boolean included) {}

    /**
     * @param messageUrl       where the specimen pages' message box sends messages; null when there's no box
     * @param siteUrl          where the public site is served
     * @param publicCount      specimens that will show on the site (marked public and not gone)
     * @param goneCount        specimens no longer in the collection, which are never published
     * @param gitHubConfigured false when the GitHub token is missing, so publishing can't work
     */
    public record Settings(List<Field> fields, String intro, String messageUrl, Instant lastPublishedAt, String siteUrl,
                           long publicCount, long goneCount, long totalCount, boolean gitHubConfigured) {}

    public record SettingsRequest(
            @NotNull(message = "fields is required") Set<PublishField> fields,
            @Size(max = 5000, message = "intro must be at most 5000 characters") String intro,
            @Size(max = 500, message = "messageUrl must be at most 500 characters")
            @Pattern(regexp = "\\s*(https://\\S+)?\\s*", message = "messageUrl must be an https:// address")
            String messageUrl) {}

    /** @param changed false when the site was already up to date, so no commit was made */
    public record Result(boolean changed, int specimenCount, String siteUrl, Instant publishedAt) {}
}
