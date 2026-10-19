// PublishDto.java - API representations of the publish settings and of a publish run
package com.rockcollection.publish;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public final class PublishDto {
    private PublishDto() {}

    /** One checkbox in the Publish dialog. */
    public record Field(PublishField key, String label, String group, boolean included) {}

    /**
     * @param siteUrl          where the public site is served
     * @param publicCount      specimens marked to show on the site
     * @param gitHubConfigured false when the GitHub token is missing, so publishing can't work
     */
    public record Settings(List<Field> fields, String intro, Instant lastPublishedAt, String siteUrl,
                           long publicCount, long totalCount, boolean gitHubConfigured) {}

    public record SettingsRequest(
            @NotNull(message = "fields is required") Set<PublishField> fields,
            @Size(max = 5000, message = "intro must be at most 5000 characters") String intro) {}

    /** @param changed false when the site was already up to date, so no commit was made */
    public record Result(boolean changed, int specimenCount, String siteUrl, Instant publishedAt) {}
}
