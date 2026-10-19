// GitHubProperties.java - Settings for the GitHub Pages repo (rockcollection.github.* in application.properties)
package com.rockcollection.github;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param token  fine-grained personal access token limited to {@code repo} (Contents: read and write);
 *               comes from the GITHUB_TOKEN env var and is never committed
 * @param repo   "owner/name" of the public Pages repo
 * @param branch branch GitHub Pages serves from
 * @param apiUrl GitHub REST API base URL (overridden in tests)
 */
@ConfigurationProperties("rockcollection.github")
public record GitHubProperties(String token, String repo, String branch, String apiUrl) {

    public boolean configured() {
        return token != null && !token.isBlank() && repo != null && !repo.isBlank();
    }
}
