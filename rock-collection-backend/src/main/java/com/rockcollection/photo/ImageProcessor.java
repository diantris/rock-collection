// ImageProcessor.java - Turns uploaded photos into web-sized JPEGs and table thumbnails, without metadata
package com.rockcollection.photo;

import com.rockcollection.common.BadRequestException;
import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * Every output is re-encoded from pixels, so nothing from the original file survives: no EXIF, no GPS location,
 * no camera details. The EXIF orientation is applied first, so phone photos aren't sideways.
 */
@Component
public class ImageProcessor {

    /** Longest edge of a published photo, in pixels. */
    static final int WEB_SIZE = 1600;
    /** Longest edge of the small copy the public site's index cards use. */
    static final int SMALL_SIZE = 480;
    /** Edge of the square table thumbnail; about 3× its on-screen size, so it stays sharp on high-DPI screens. */
    static final int THUMBNAIL_SIZE = 192;
    static final double WEB_QUALITY = 0.85;
    static final double THUMBNAIL_QUALITY = 0.8;

    public record Image(byte[] data, int width, int height) {}

    /** Resized (never enlarged) JPEG for the public site. */
    public Image toWebPhoto(byte[] original) {
        return fit(decode(original), WEB_SIZE, WEB_QUALITY);
    }

    /** Small copy of a photo for the public site's index, so the overview doesn't load every full photo. */
    public Image toSmallPhoto(byte[] photo) {
        return fit(decode(photo), SMALL_SIZE, WEB_QUALITY);
    }

    /** Shrinks to fit a {@code size}×{@code size} box, keeping the aspect ratio; never enlarges. */
    private static Image fit(BufferedImage image, int size, double quality) {
        int longest = Math.max(image.getWidth(), image.getHeight());
        try {
            var builder = Thumbnails.of(image);
            BufferedImage resized = (longest > size ? builder.size(size, size) : builder.scale(1.0)).asBufferedImage();
            return new Image(encode(resized, quality), resized.getWidth(), resized.getHeight());
        } catch (IOException e) {
            throw new IllegalStateException("Couldn't resize photo", e);
        }
    }

    /** Small square JPEG, cropped from the middle. */
    public byte[] toThumbnail(byte[] photo) {
        try {
            BufferedImage square = Thumbnails.of(decode(photo))
                    .size(THUMBNAIL_SIZE, THUMBNAIL_SIZE).crop(Positions.CENTER).asBufferedImage();
            return encode(square, THUMBNAIL_QUALITY);
        } catch (IOException e) {
            throw new IllegalStateException("Couldn't make thumbnail", e);
        }
    }

    /** Decodes JPEG / PNG / GIF / BMP with the EXIF orientation applied, and transparency flattened onto white. */
    private static BufferedImage decode(byte[] bytes) {
        BufferedImage image;
        try {
            image = Thumbnails.of(new ByteArrayInputStream(bytes)).scale(1.0).asBufferedImage();
        } catch (IOException | IllegalArgumentException e) {
            throw new BadRequestException("Unsupported or damaged image; please use JPEG or PNG");
        }
        if (image.getType() == BufferedImage.TYPE_INT_RGB) return image;
        BufferedImage rgb = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        g.setColor(Color.WHITE); // JPEG has no transparency; without this it would turn black
        g.fillRect(0, 0, rgb.getWidth(), rgb.getHeight());
        g.drawImage(image, 0, 0, null);
        g.dispose();
        return rgb;
    }

    private static byte[] encode(BufferedImage image, double quality) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Thumbnails.of(image).scale(1.0).outputFormat("jpg").outputQuality(quality).toOutputStream(out);
        return out.toByteArray();
    }
}
