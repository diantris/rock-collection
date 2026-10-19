// PhotoDto.java - API representation of a photo
package com.rockcollection.photo;

/**
 * @param fileName path inside the Pages repo
 * @param url      where the browser can load the full photo
 * @param smallUrl the small copy (480px), for tiles and cards
 * @param position 0 is the cover
 */
public record PhotoDto(Long id, String fileName, String url, String smallUrl, String caption, int position, Integer width, Integer height) {

    static PhotoDto from(SpecimenPhoto p, String url, String smallUrl) {
        return new PhotoDto(p.getId(), p.getFileName(), url, smallUrl, p.getCaption(), p.getPosition(), p.getWidth(), p.getHeight());
    }
}
