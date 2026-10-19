// GitHubException.java - The GitHub Pages repo isn't configured or can't be reached (mapped to HTTP 503)
package com.rockcollection.github;

public class GitHubException extends RuntimeException {
    public GitHubException(String message) {
        super(message);
    }

    public GitHubException(String message, Throwable cause) {
        super(message, cause);
    }
}
