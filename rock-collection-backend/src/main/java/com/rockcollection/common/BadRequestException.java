// BadRequestException.java - Thrown for invalid input that bean validation can't express (mapped to HTTP 400)
package com.rockcollection.common;

public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
