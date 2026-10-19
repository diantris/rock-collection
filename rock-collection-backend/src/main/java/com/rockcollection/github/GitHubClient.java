// GitHubClient.java - Writes files to the GitHub Pages repo, any number at a time as a single commit
package com.rockcollection.github;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;

import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.*;
import java.util.function.Function;
import java.util.function.Predicate;

/**
 * Uses the Git Data API (tree, then commit, then ref update), so many added and deleted files make one commit.
 * Text files go inline in the tree request; only binary files need a request each (GitHub allows about 80
 * content-creating requests a minute). Files whose content is already in the repo are left out.
 */
@Component
public class GitHubClient {

    private static final Logger log = LoggerFactory.getLogger(GitHubClient.class);
    /** Sent inline as UTF-8 text in the tree request instead of as separate blobs. */
    private static final Set<String> TEXT_EXTENSIONS = Set.of("html", "css", "js", "json", "txt", "md", "svg", "xml");

    static final int MAX_ATTEMPTS = 4;

    private final GitHubProperties properties;
    private final RestClient rest;
    private final Duration retryDelay;

    @Autowired
    public GitHubClient(GitHubProperties properties) {
        this(properties, RestClient.builder().requestFactory(requestFactory()), Duration.ofSeconds(1));
    }

    /** For tests, which bind a mock server to the builder and don't want to wait between retries. */
    GitHubClient(GitHubProperties properties, RestClient.Builder builder, Duration retryDelay) {
        this.properties = properties;
        this.retryDelay = retryDelay;
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
        factory.setReadTimeout(Duration.ofSeconds(120));
        return factory;
    }

    public boolean isConfigured() {
        return properties.configured();
    }

    /** Public URL of a file in the repo; it works as soon as the commit exists (GitHub Pages takes a minute longer). */
    public String rawUrl(String path) {
        return "https://raw.githubusercontent.com/" + properties.repo() + "/" + properties.branch() + "/" + path;
    }

    /** Address of the GitHub Pages site, e.g. https://owner.github.io/repo/. */
    public String pagesUrl() {
        String[] ownerAndName = properties.repo().split("/", 2);
        return "https://" + ownerAndName[0].toLowerCase(Locale.ROOT) + ".github.io/" + ownerAndName[1] + "/";
    }

    /**
     * Adds or replaces {@code files} and deletes {@code deletions} in one commit on the configured branch.
     * Deletions of files that aren't there are ignored.
     * @param files     repo path → file content
     * @return the new commit's sha, or empty if nothing would change
     */
    public Optional<String> commit(String message, Map<String, byte[]> files, Collection<String> deletions) {
        Set<String> toDelete = new HashSet<>(deletions);
        return commit(message, files, existing -> existing.stream().filter(toDelete::contains).toList());
    }

    /**
     * Makes the files matching {@code managed} exactly {@code files}: writes the new and changed ones and deletes
     * managed files that aren't in {@code files}. Everything else in the repo (e.g. photos) stays as it is.
     * @return the new commit's sha, or empty if the repo already matched
     */
    public Optional<String> replaceAll(String message, Map<String, byte[]> files, Predicate<String> managed) {
        return commit(message, files, existing -> existing.stream().filter(managed).filter(p -> !files.containsKey(p)).toList());
    }

    /**
     * Right after a commit, GitHub can still report the previous branch head for a moment; a commit built on it
     * is then refused as "not a fast forward". In that case the whole commit is rebuilt on the new head and retried.
     */
    private Optional<String> commit(String message, Map<String, byte[]> files, Function<Set<String>, List<String>> deletions) {
        requireConfigured();
        for (int attempt = 1; ; attempt++) {
            try {
                return commitOnce(message, files, deletions);
            } catch (GitHubException e) {
                boolean staleHead = e.getCause() instanceof HttpClientErrorException http
                        && http.getStatusCode().value() == 422 && http.getResponseBodyAsString().contains("fast forward");
                if (!staleHead || attempt == MAX_ATTEMPTS) throw e;
                log.info("Branch moved while committing to {}, retrying ({}/{})", properties.repo(), attempt, MAX_ATTEMPTS);
                sleep(retryDelay.multipliedBy(attempt));
            }
        }
    }

    /** @param deletions picks the paths to delete from the paths currently in the repo */
    private Optional<String> commitOnce(String message, Map<String, byte[]> files, Function<Set<String>, List<String>> deletions) {
        try {
            String ref = repoPath("/git/refs/heads/" + properties.branch());
            String parent = rest.get().uri(ref).retrieve().body(RefResponse.class).object().sha();
            String baseTree = rest.get().uri(repoPath("/git/commits/" + parent)).retrieve().body(CommitResponse.class).tree().sha();
            Map<String, String> existing = listFiles(baseTree);

            List<Map<String, Object>> entries = new ArrayList<>();
            for (var file : files.entrySet()) {
                if (gitBlobSha(file.getValue()).equals(existing.get(file.getKey()))) continue; // unchanged
                entries.add(isText(file.getKey())
                        ? treeEntry(file.getKey(), "content", new String(file.getValue(), StandardCharsets.UTF_8))
                        : treeEntry(file.getKey(), "sha", createBlob(file.getValue())));
            }
            List<String> deleted = deletions.apply(existing.keySet());
            for (String path : deleted) entries.add(treeEntry(path, "sha", null)); // a null sha removes the file
            if (entries.isEmpty()) {
                log.info("Nothing to commit to {}: {}", properties.repo(), message);
                return Optional.empty();
            }

            String tree = rest.post().uri(repoPath("/git/trees"))
                    .body(Map.of("base_tree", baseTree, "tree", entries))
                    .retrieve().body(ShaResponse.class).sha();
            String commit = rest.post().uri(repoPath("/git/commits"))
                    .body(Map.of("message", message, "tree", tree, "parents", List.of(parent)))
                    .retrieve().body(ShaResponse.class).sha();
            rest.patch().uri(ref).body(Map.of("sha", commit)).retrieve().toBodilessEntity();
            log.info("Committed {} change(s) to {}: {}", entries.size(), properties.repo(), message);
            return Optional.of(commit);
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

    /** path → blob sha of every file in the tree. */
    private Map<String, String> listFiles(String treeSha) {
        TreeResponse tree = rest.get().uri(repoPath("/git/trees/" + treeSha + "?recursive=1")).retrieve().body(TreeResponse.class);
        if (tree.truncated()) throw new GitHubException("The Pages repo has too many files to list in one request");
        Map<String, String> files = new HashMap<>();
        for (TreeItem item : tree.tree()) if ("blob".equals(item.type())) files.put(item.path(), item.sha());
        return files;
    }

    private String createBlob(byte[] content) {
        return rest.post().uri(repoPath("/git/blobs"))
                .body(Map.of("content", Base64.getEncoder().encodeToString(content), "encoding", "base64"))
                .retrieve().body(ShaResponse.class).sha();
    }

    /** The sha git gives a file with this content, so unchanged files can be recognised without uploading them. */
    static String gitBlobSha(byte[] content) {
        try {
            MessageDigest sha1 = MessageDigest.getInstance("SHA-1");
            sha1.update(("blob " + content.length + "\0").getBytes(StandardCharsets.US_ASCII));
            return HexFormat.of().formatHex(sha1.digest(content));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static boolean isText(String path) {
        String name = path.substring(path.lastIndexOf('/') + 1);
        int dot = name.lastIndexOf('.');
        return dot <= 0 || TEXT_EXTENSIONS.contains(name.substring(dot + 1).toLowerCase(Locale.ROOT)); // e.g. ".nojekyll"
    }

    private static void sleep(Duration duration) {
        try {
            Thread.sleep(duration);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new GitHubException("Interrupted while waiting to retry", e);
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

    private static Map<String, Object> treeEntry(String path, String key, String value) {
        Map<String, Object> entry = new LinkedHashMap<>(); // Map.of doesn't allow the null sha
        entry.put("path", path);
        entry.put("mode", "100644");
        entry.put("type", "blob");
        entry.put(key, value);
        return entry;
    }

    record ShaResponse(String sha) {}
    record RefResponse(ShaResponse object) {}
    record CommitResponse(ShaResponse tree) {}
    record TreeItem(String path, String type, String sha) {}
    record TreeResponse(List<TreeItem> tree, boolean truncated) {}
}
