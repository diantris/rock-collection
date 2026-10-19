package com.rockcollection.github;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.client.ExpectedCount.never;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GitHubClientTest {
    private static final String API = "https://api.github.test";
    private static final String REPO = API + "/repos/owner/pages";
    private static final GitHubProperties PROPERTIES = new GitHubProperties("secret-token", "owner/pages", "main", API);

    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    private final GitHubClient client = new GitHubClient(PROPERTIES, builder, Duration.ZERO);

    private static byte[] utf8(String s) {
        return s.getBytes(StandardCharsets.UTF_8);
    }

    /** The first three calls of every commit: branch head, its tree, and the files in it. */
    private void expectCurrentFiles(String treeJson) {
        server.expect(requestTo(REPO + "/git/refs/heads/main")).andExpect(method(HttpMethod.GET))
                .andExpect(header("Authorization", "Bearer secret-token"))
                .andRespond(withSuccess("{\"object\":{\"sha\":\"parent\"}}", APPLICATION_JSON));
        server.expect(requestTo(REPO + "/git/commits/parent"))
                .andRespond(withSuccess("{\"tree\":{\"sha\":\"base-tree\"}}", APPLICATION_JSON));
        server.expect(requestTo(REPO + "/git/trees/base-tree?recursive=1"))
                .andRespond(withSuccess("{\"truncated\": false, \"tree\": " + treeJson + "}", APPLICATION_JSON));
    }

    private void expectCommitAndRefUpdate(String message) {
        server.expect(requestTo(REPO + "/git/commits")).andExpect(method(HttpMethod.POST))
                .andExpect(content().json("{\"message\": \"" + message + "\", \"tree\": \"tree\", \"parents\": [\"parent\"]}"))
                .andRespond(withSuccess("{\"sha\":\"new-commit\"}", APPLICATION_JSON));
        server.expect(requestTo(REPO + "/git/refs/heads/main")).andExpect(method(HttpMethod.PATCH))
                .andExpect(jsonPath("$.sha").value("new-commit"))
                .andRespond(withSuccess());
    }

    @Test
    void commit_uploadsBinaryFilesAsBlobsAndDeletesOnlyFilesThatExist() {
        expectCurrentFiles("[{\"path\": \"photos/1/old.jpg\", \"type\": \"blob\", \"sha\": \"old\"}]");
        server.expect(requestTo(REPO + "/git/blobs")).andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.content").value(Base64.getEncoder().encodeToString(utf8("jpeg"))))
                .andExpect(jsonPath("$.encoding").value("base64"))
                .andRespond(withSuccess("{\"sha\":\"blob\"}", APPLICATION_JSON));
        server.expect(requestTo(REPO + "/git/trees")).andExpect(method(HttpMethod.POST))
                .andExpect(content().json("""
                        {"base_tree": "base-tree", "tree": [
                          {"path": "photos/1/new.jpg", "mode": "100644", "type": "blob", "sha": "blob"},
                          {"path": "photos/1/old.jpg", "mode": "100644", "type": "blob", "sha": null}]}""", true))
                .andRespond(withSuccess("{\"sha\":\"tree\"}", APPLICATION_JSON));
        expectCommitAndRefUpdate("Add a photo");

        Optional<String> sha = client.commit("Add a photo",
                Map.of("photos/1/new.jpg", utf8("jpeg")), List.of("photos/1/old.jpg", "photos/1/never-existed.jpg"));

        assertThat(sha).contains("new-commit");
        server.verify();
    }

    @Test
    void replaceAll_sendsTextInlineSkipsUnchangedFilesAndRemovesStaleOnes() {
        String unchangedPage = "<h1>#1</h1>";
        expectCurrentFiles("""
                [{"path": "index.html", "type": "blob", "sha": "outdated"},
                 {"path": "specimens/1/index.html", "type": "blob", "sha": "%s"},
                 {"path": "specimens/2/index.html", "type": "blob", "sha": "stale"},
                 {"path": "specimens", "type": "tree", "sha": "dir"},
                 {"path": "photos/1/a.jpg", "type": "blob", "sha": "photo"},
                 {"path": "README.md", "type": "blob", "sha": "readme"}]""".formatted(GitHubClient.gitBlobSha(utf8(unchangedPage))));
        server.expect(requestTo(REPO + "/git/trees")).andExpect(method(HttpMethod.POST))
                .andExpect(content().json("""
                        {"base_tree": "base-tree", "tree": [
                          {"path": "index.html", "mode": "100644", "type": "blob", "content": "<h1>Rocks</h1>"},
                          {"path": "specimens/2/index.html", "mode": "100644", "type": "blob", "sha": null}]}""", true))
                .andRespond(withSuccess("{\"sha\":\"tree\"}", APPLICATION_JSON));
        expectCommitAndRefUpdate("Publish");

        Map<String, byte[]> site = new LinkedHashMap<>();
        site.put("index.html", utf8("<h1>Rocks</h1>"));
        site.put("specimens/1/index.html", utf8(unchangedPage));
        Optional<String> sha = client.replaceAll("Publish", site, p -> !p.startsWith("photos/") && !p.equals("README.md"));

        assertThat(sha).contains("new-commit");
        server.verify(); // no blob requests: the pages went inline, the photo and README were left alone
    }

    @Test
    void replaceAll_nothingChanged_makesNoCommit() {
        String page = "<h1>Rocks</h1>";
        expectCurrentFiles("[{\"path\": \"index.html\", \"type\": \"blob\", \"sha\": \"" + GitHubClient.gitBlobSha(utf8(page)) + "\"}]");
        server.expect(never(), requestTo(REPO + "/git/trees"));

        assertThat(client.replaceAll("Publish", Map.of("index.html", utf8(page)), p -> true)).isEmpty();
        server.verify();
    }

    @Test
    void commit_branchMovedMeanwhile_isRebuiltOnTheNewHeadAndRetried() {
        String photo = "[{\"path\": \"photos/1/old.jpg\", \"type\": \"blob\", \"sha\": \"old\"}]";
        String tree = "{\"base_tree\": \"base-tree\", \"tree\": [{\"path\": \"photos/1/old.jpg\", \"mode\": \"100644\", \"type\": \"blob\", \"sha\": null}]}";
        // First attempt: GitHub still reported the previous head, so the ref update is refused
        expectCurrentFiles(photo);
        server.expect(requestTo(REPO + "/git/trees")).andExpect(content().json(tree)).andRespond(withSuccess("{\"sha\":\"tree\"}", APPLICATION_JSON));
        server.expect(requestTo(REPO + "/git/commits")).andRespond(withSuccess("{\"sha\":\"stale-commit\"}", APPLICATION_JSON));
        server.expect(requestTo(REPO + "/git/refs/heads/main")).andExpect(method(HttpMethod.PATCH))
                .andRespond(withStatus(HttpStatus.UNPROCESSABLE_CONTENT).contentType(APPLICATION_JSON)
                        .body("{\"message\": \"Update is not a fast forward\", \"status\": \"422\"}"));
        // Second attempt succeeds
        expectCurrentFiles(photo);
        server.expect(requestTo(REPO + "/git/trees")).andExpect(content().json(tree)).andRespond(withSuccess("{\"sha\":\"tree\"}", APPLICATION_JSON));
        expectCommitAndRefUpdate("Remove");

        assertThat(client.commit("Remove", Map.of(), List.of("photos/1/old.jpg"))).contains("new-commit");
        server.verify();
    }

    @Test
    void commit_shortRateLimit_isWaitedOutAndBlobsAlreadyUploadedAreNotSentAgain() {
        Map<String, byte[]> photos = new LinkedHashMap<>();
        photos.put("photos/1/a.jpg", utf8("first"));
        photos.put("photos/1/b.jpg", utf8("second"));
        // First attempt: the second blob hits GitHub's secondary rate limit
        expectCurrentFiles("[]");
        server.expect(requestTo(REPO + "/git/blobs")).andExpect(jsonPath("$.content").value(Base64.getEncoder().encodeToString(utf8("first"))))
                .andRespond(withSuccess("{\"sha\":\"blob-a\"}", APPLICATION_JSON));
        server.expect(requestTo(REPO + "/git/blobs")).andExpect(jsonPath("$.content").value(Base64.getEncoder().encodeToString(utf8("second"))))
                .andRespond(withStatus(HttpStatus.FORBIDDEN).header("Retry-After", "0").contentType(APPLICATION_JSON)
                        .body("{\"message\": \"You have exceeded a secondary rate limit.\"}"));
        // Second attempt: only the missing blob is uploaded
        expectCurrentFiles("[]");
        server.expect(requestTo(REPO + "/git/blobs")).andExpect(jsonPath("$.content").value(Base64.getEncoder().encodeToString(utf8("second"))))
                .andRespond(withSuccess("{\"sha\":\"blob-b\"}", APPLICATION_JSON));
        server.expect(requestTo(REPO + "/git/trees")).andExpect(content().json("""
                        {"base_tree": "base-tree", "tree": [
                          {"path": "photos/1/a.jpg", "sha": "blob-a"}, {"path": "photos/1/b.jpg", "sha": "blob-b"}]}"""))
                .andRespond(withSuccess("{\"sha\":\"tree\"}", APPLICATION_JSON));
        expectCommitAndRefUpdate("Add photos");

        assertThat(client.commit("Add photos", photos, List.of())).contains("new-commit");
        server.verify();
    }

    @Test
    void commit_longRateLimit_saysHowLongToWait() {
        expectCurrentFiles("[]");
        server.expect(requestTo(REPO + "/git/blobs"))
                .andRespond(withStatus(HttpStatus.FORBIDDEN).header("x-ratelimit-remaining", "0")
                        .header("x-ratelimit-reset", String.valueOf(java.time.Instant.now().getEpochSecond() + 1800)));

        assertThatThrownBy(() -> client.commit("Add a photo", Map.of("photos/1/a.jpg", utf8("x")), List.of()))
                .isInstanceOf(GitHubException.class).hasMessageContaining("limit").hasMessageContaining("30 minutes");
        server.verify(); // no retry
    }

    @Test
    void commit_forbiddenForAnotherReason_isNotTreatedAsARateLimit() {
        server.expect(requestTo(REPO + "/git/refs/heads/main")).andRespond(withStatus(HttpStatus.FORBIDDEN)
                .contentType(APPLICATION_JSON).body("{\"message\": \"Resource not accessible by personal access token\"}"));

        assertThatThrownBy(() -> client.commit("x", Map.of(), List.of("a.jpg")))
                .isInstanceOf(GitHubException.class).hasMessageContaining("not accessible");
        server.verify();
    }

    @Test
    void commit_gitHubError_isReportedAsGitHubException() {
        server.expect(requestTo(REPO + "/git/refs/heads/main")).andRespond(withServerError());

        assertThatThrownBy(() -> client.commit("x", Map.of(), List.of("a.jpg"))).isInstanceOf(GitHubException.class);
    }

    @Test
    void commit_withoutToken_failsWithoutCallingGitHub() {
        GitHubClient unconfigured = new GitHubClient(new GitHubProperties("", "owner/pages", "main", API), RestClient.builder(), Duration.ZERO);

        assertThat(unconfigured.isConfigured()).isFalse();
        assertThatThrownBy(() -> unconfigured.commit("x", Map.of(), List.of()))
                .isInstanceOf(GitHubException.class).hasMessageContaining("GITHUB_TOKEN");
    }

    @Test
    void urls() {
        assertThat(client.rawUrl("photos/1/a.jpg")).isEqualTo("https://raw.githubusercontent.com/owner/pages/main/photos/1/a.jpg");
        assertThat(new GitHubClient(new GitHubProperties("t", "Diantris/rock-collection-page", "main", API)).pagesUrl())
                .isEqualTo("https://diantris.github.io/rock-collection-page/");
    }

    @Test
    void gitBlobSha_matchesGit() {
        // Known values: `git hash-object` of an empty file and of "hello\n"
        assertThat(GitHubClient.gitBlobSha(new byte[0])).isEqualTo("e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
        assertThat(GitHubClient.gitBlobSha(utf8("hello\n"))).isEqualTo("ce013625030ba8dba906f756967f9e9ca394464a");
    }
}
