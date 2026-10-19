package com.rockcollection.github;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GitHubClientTest {
    private static final String API = "https://api.github.test";
    private static final GitHubProperties PROPERTIES = new GitHubProperties("secret-token", "owner/pages", "main", API);

    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    private final GitHubClient client = new GitHubClient(PROPERTIES, builder);

    @Test
    void commit_addsAndDeletesFilesInOneCommit() {
        String repo = API + "/repos/owner/pages";
        server.expect(requestTo(repo + "/git/refs/heads/main")).andExpect(method(HttpMethod.GET))
                .andExpect(header("Authorization", "Bearer secret-token"))
                .andRespond(withSuccess("{\"object\":{\"sha\":\"parent\"}}", APPLICATION_JSON));
        server.expect(requestTo(repo + "/git/commits/parent"))
                .andRespond(withSuccess("{\"tree\":{\"sha\":\"base-tree\"}}", APPLICATION_JSON));
        server.expect(requestTo(repo + "/git/blobs")).andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.content").value(Base64.getEncoder().encodeToString("jpeg".getBytes(StandardCharsets.UTF_8))))
                .andExpect(jsonPath("$.encoding").value("base64"))
                .andRespond(withSuccess("{\"sha\":\"blob\"}", APPLICATION_JSON));
        server.expect(requestTo(repo + "/git/trees")).andExpect(method(HttpMethod.POST))
                .andExpect(content().json("""
                        {"base_tree": "base-tree", "tree": [
                          {"path": "photos/1/new.jpg", "mode": "100644", "type": "blob", "sha": "blob"},
                          {"path": "photos/1/old.jpg", "mode": "100644", "type": "blob", "sha": null}]}"""))
                .andRespond(withSuccess("{\"sha\":\"tree\"}", APPLICATION_JSON));
        server.expect(requestTo(repo + "/git/commits")).andExpect(method(HttpMethod.POST))
                .andExpect(content().json("{\"message\": \"Add a photo\", \"tree\": \"tree\", \"parents\": [\"parent\"]}"))
                .andRespond(withSuccess("{\"sha\":\"new-commit\"}", APPLICATION_JSON));
        server.expect(requestTo(repo + "/git/refs/heads/main")).andExpect(method(HttpMethod.PATCH))
                .andExpect(jsonPath("$.sha").value("new-commit"))
                .andRespond(withSuccess());

        String sha = client.commit("Add a photo",
                Map.of("photos/1/new.jpg", "jpeg".getBytes(StandardCharsets.UTF_8)), List.of("photos/1/old.jpg"));

        assertThat(sha).isEqualTo("new-commit");
        server.verify();
    }

    @Test
    void commit_gitHubError_isReportedAsGitHubException() {
        server.expect(requestTo(API + "/repos/owner/pages/git/refs/heads/main")).andRespond(withServerError());

        assertThatThrownBy(() -> client.commit("x", Map.of(), List.of("a.jpg"))).isInstanceOf(GitHubException.class);
    }

    @Test
    void commit_withoutToken_failsWithoutCallingGitHub() {
        GitHubClient unconfigured = new GitHubClient(new GitHubProperties("", "owner/pages", "main", API), RestClient.builder());

        assertThat(unconfigured.isConfigured()).isFalse();
        assertThatThrownBy(() -> unconfigured.commit("x", Map.of(), List.of()))
                .isInstanceOf(GitHubException.class).hasMessageContaining("GITHUB_TOKEN");
    }

    @Test
    void rawUrl_pointsAtTheBranch() {
        assertThat(client.rawUrl("photos/1/a.jpg"))
                .isEqualTo("https://raw.githubusercontent.com/owner/pages/main/photos/1/a.jpg");
    }
}
