package com.rockcollection.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.core.MethodParameter;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class GlobalExceptionHandlerTest {
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleValidationExceptions_returnsBadRequest() {
        // Create a dummy BindingResult with a field error
        Object target = new Object();
        BindingResult bindingResult = new BeanPropertyBindingResult(target, "objectName");
        bindingResult.addError(new FieldError("objectName", "field", "must not be null"));
        // Use Mockito to mock a MethodParameter
        MethodParameter methodParameter = mock(MethodParameter.class);
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(methodParameter, bindingResult);
        ResponseEntity<Map<String, String>> response = handler.handleValidationExceptions(ex);
        assertEquals(400, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("must not be null", response.getBody().get("field"));
    }
}
