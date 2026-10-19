// AppHeaderFilter.java - Refuses changes to the data unless the request carries the app's own header
package com.rockcollection.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Access control is the network (an IP allowlist), so any web page open in the owner's browser could send requests
 * to the API from an allowed address. Browsers let another site send a plain form POST without asking, but not one
 * with a custom header: that needs the API's CORS permission, which only the app's own address gets. So every
 * POST / PUT / PATCH / DELETE must carry {@value #HEADER}; the frontend's api.ts always sends it.
 */
@Component
public class AppHeaderFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Rock-Collection";
    private static final Set<String> CHANGES = Set.of("POST", "PUT", "PATCH", "DELETE");

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/") || !CHANGES.contains(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (request.getHeader(HEADER) == null) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"Changes must come from the app (missing the " + HEADER + " header)\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
