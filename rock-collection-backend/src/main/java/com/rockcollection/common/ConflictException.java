// ConflictException.java - Thrown when a request conflicts with existing data (mapped to HTTP 409)
package com.rockcollection.common;

public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
