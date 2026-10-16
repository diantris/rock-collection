// PageResponse.java - Stable JSON shape for paginated API responses
package com.rockcollection.common;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * @param page zero-based page number
 */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {
    public static <E, T> PageResponse<T> from(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(page.getContent().stream().map(mapper).toList(),
                page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
