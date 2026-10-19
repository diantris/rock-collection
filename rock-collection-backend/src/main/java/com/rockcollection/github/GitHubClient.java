// GitHubClient.java - Writes files to the GitHub Pages repo, several at a time as a single commit
package com.rockcollection.github;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.*;

/**
 * Uses the Git Data API (blobs, then a tree, a commit and a ref update), so any number of added and
 * deleted files end up in one commit instead of one commit per file.
 */
@Component
public class GitHubClient {

    private static final Logger log = LoggerFactory.getLogger(GitHubClient.class);

    private final GitHubProperties properties;
    private final RestClient rest;

    @Autowired
    public GitHubClient(GitHubProperties properties) {
        this(properties, RestClient.builder().requestFactory(requestFactory()));
    }

    /** For tests, which bind a mock server to the builder. */
    GitHubClient(GitHubProperties properties, RestClient.Builder builder) {
        this.properties = properties;
        this.rest = builder
                .baseUrl(properties.apiUrl())
                .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28")
                .defaultHeaders(h -> {
                    if (properties.configured()) h.setBearerAuth(properties.token());
                })
                .build();
    }

    private static JdkClientHttpRequestFactory requestFactory() {
        HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(60));
        return factory;
    }

    public boolean isConfigured() {
        return properties.configured();
    }

    /** Public URL of a file in the repo; it works as soon as the commit exists (GitHub Pages takes a minute longer). */
    public String rawUrl(String path) {
        return "https://raw.githubusercontent.com/" + properties.repo() + "/" + properties.branch() + "/" + path;
    }

    /**
     * Adds or replaces {@code files} and deletes {@code deletions} in one commit on the configured branch.
     * @param files     repo path → file content
     * @param deletions repo paths to remove; they must exist
     * @return the new commit's sha
     */
    public String commit(String message, Map<String, byte[]> files, Collection<String> deletions) {
        requireConfigured();
        try {
            String ref = repoPath("/git/refs/heads/" + properties.branch());
            String parent = rest.get().uri(ref).retrieve().body(RefResponse.class).object().sha();
            String baseTree = rest.get().uri(repoPath("/git/commits/" + parent)).retrieve().body(CommitResponse.class).tree().sha();

            List<Map<String, Object>> entries = new ArrayList<>();
            for (var file : files.entrySet()) {
                String content = Base64.getEncoder().encodeToString(file.getValue());
                String blob = rest.post().uri(repoPath("/git/blobs"))
                        .body(Map.of("content", content, "encoding", "base64"))
                        .retrieve().body(ShaResponse.class).sha();
                entries.add(treeEntry(file.getKey(), blob));
            }
            for (String path : deletions) entries.add(treeEntry(path, null)); // a null sha removes the file

            String tree = rest.post().uri(repoPath("/git/trees"))
                    .body(Map.of("base_tree", baseTree, "tree", entries))
                    .retrieve().body(ShaResponse.class).sha();
            String commit = rest.post().uri(repoPath("/git/commits"))
                    .body(Map.of("message", message, "tree", tree, "parents", List.of(parent)))
                    .retrieve().body(ShaResponse.class).sha();
            rest.patch().uri(ref).body(Map.of("sha", commit)).retrieve().toBodilessEntity();
            log.info("Committed {} file(s) and {} deletion(s) to {}: {}", files.size(), deletions.size(), properties.repo(), message);
            return commit;
        } catch (RestClientException e) {
            throw new GitHubException("Couldn't save to GitHub (" + properties.repo() + "): " + e.getMessage(), e);
        }
    }

    /** Content of a file in the repo, read through the API so it's current right after a commit. */
    public byte[] download(String path) {
        requireConfigured();
        try {
            return rest.get().uri(repoPath("/contents/" + path + "?ref=" + properties.branch()))
                    .header(HttpHeaders.ACCEPT, "application/vnd.github.raw+json")
                    .retrieve().body(byte[].class);
        } catch (RestClientException e) {
            throw new GitHubException("Couldn't read " + path + " from GitHub: " + e.getMessage(), e);
        }
    }

    private void requireConfigured() {
        if (!isConfigured()) {
            throw new GitHubException("The GitHub Pages repo isn't set up: GITHUB_TOKEN is missing (see .env.example)");
        }
    }

    private String repoPath(String suffix) {
        return "/repos/" + properties.repo() + suffix;
    }

    private static Map<String, Object> treeEntry(String path, String sha) {
        Map<String, Object> entry = new LinkedHashMap<>(); // Map.of doesn't allow the null sha
        entry.put("path", path);
        entry.put("mode", "100644");
        entry.put("type", "blob");
        entry.put("sha", sha);
        return entry;
    }

    record ShaResponse(String sha) {}
    record RefResponse(ShaResponse object) {}
    record CommitResponse(ShaResponse tree) {}
}
