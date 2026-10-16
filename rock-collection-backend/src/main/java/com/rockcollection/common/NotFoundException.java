// NotFoundException.java - Thrown when a requested resource does not exist (mapped to HTTP 404)
package com.rockcollection.common;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String resource, Long id) {
        super(resource + " " + id + " not found");
    }
}
