// ImageProcessor.java - Turns uploaded photos into web-sized JPEGs and table thumbnails, without metadata
package com.rockcollection.photo;

import com.rockcollection.common.BadRequestException;
import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;
import net.coobird.thumbnailator.util.exif.ExifFilterUtils;
import net.coobird.thumbnailator.util.exif.ExifUtils;
import net.coobird.thumbnailator.util.exif.Orientation;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.MemoryCacheImageInputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.concurrent.Semaphore;
import java.util.function.Supplier;

/**
 * Every output is re-encoded from pixels, so nothing from the original file survives: no EXIF, no GPS location,
 * no camera details. The EXIF orientation is applied first, so phone photos aren't sideways.
 * <p>
 * Built for a small server (1 GB of RAM): a photo far bigger than needed is decoded at a fraction of its
 * resolution (a 200 MP photo then takes about as much memory as a 12 MP one), absurdly large images are refused
 * before decoding, and only one image is processed at a time; other requests wait their turn.
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
    /** Largest image accepted: above any phone camera (200 MP), far below a "decompression bomb". */
    static final long MAX_PIXELS = 250_000_000L;

    /** One image at a time: a decoded photo can take ~100 MB, and two at once could exhaust a small heap. */
    private final Semaphore permit = new Semaphore(1, true);

    public record Image(byte[] data, int width, int height) {}

    /** Resized (never enlarged) JPEG for the public site. */
    public Image toWebPhoto(byte[] original) {
        return oneAtATime(() -> fit(decode(original, WEB_SIZE), WEB_SIZE, WEB_QUALITY));
    }

    /** Small copy of a photo for the public site's index, so the overview doesn't load every full photo. */
    public Image toSmallPhoto(byte[] photo) {
        return oneAtATime(() -> fit(decode(photo, SMALL_SIZE), SMALL_SIZE, WEB_QUALITY));
    }

    /** Small square JPEG, cropped from the middle. */
    public byte[] toThumbnail(byte[] photo) {
        return oneAtATime(() -> {
            try {
                BufferedImage square = Thumbnails.of(decode(photo, THUMBNAIL_SIZE * 2))
                        .size(THUMBNAIL_SIZE, THUMBNAIL_SIZE).crop(Positions.CENTER)
                        .imageType(BufferedImage.TYPE_INT_RGB).asBufferedImage();
                return encode(square, THUMBNAIL_QUALITY);
            } catch (IOException e) {
                throw new IllegalStateException("Couldn't make thumbnail", e);
            }
        });
    }

    /** Shrinks to fit a {@code size}×{@code size} box, keeping the aspect ratio; never enlarges. */
    private static Image fit(BufferedImage image, int size, double quality) {
        int longest = Math.max(image.getWidth(), image.getHeight());
        try {
            var builder = Thumbnails.of(image).imageType(BufferedImage.TYPE_INT_RGB);
            BufferedImage resized = (longest > size ? builder.size(size, size) : builder.scale(1.0)).asBufferedImage();
            return new Image(encode(resized, quality), resized.getWidth(), resized.getHeight());
        } catch (IOException e) {
            throw new IllegalStateException("Couldn't resize photo", e);
        }
    }

    /**
     * Decodes JPEG / PNG / GIF / BMP with the EXIF orientation applied, and transparency flattened onto white.
     * @param needed the longest edge the result will be shrunk to; a much larger image is read with subsampling
     *               (every n-th pixel), keeping at least 1.5× this size so the final resize stays smooth.
     *               A 12 MP phone photo is still read in full (~50 MB); a 24 MP one at 3000 × 2000.
     */
    private static BufferedImage decode(byte[] bytes, int needed) {
        try (ImageInputStream in = new MemoryCacheImageInputStream(new ByteArrayInputStream(bytes))) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(in);
            if (!readers.hasNext()) throw unsupported();
            ImageReader reader = readers.next();
            try {
                reader.setInput(in, true, false); // metadata is needed for the EXIF orientation
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if ((long) width * height > MAX_PIXELS) {
                    throw new BadRequestException("Image too large (%d × %d pixels); at most %d megapixels"
                            .formatted(width, height, MAX_PIXELS / 1_000_000));
                }
                ImageReadParam param = reader.getDefaultReadParam();
                int step = Math.max(1, Math.max(width, height) * 2 / (needed * 3));
                if (step > 1) param.setSourceSubsampling(step, step, 0, 0);
                BufferedImage image = reader.read(0, param);
                return flatten(orient(image, orientation(reader)));
            } finally {
                reader.dispose();
            }
        } catch (IOException | IllegalArgumentException e) {
            throw unsupported();
        }
    }

    /** The EXIF orientation, or null when there's none (or it can't be read, which isn't worth failing for). */
    private static Orientation orientation(ImageReader reader) {
        try {
            return ExifUtils.getExifOrientation(reader, 0);
        } catch (IOException | RuntimeException e) {
            return null;
        }
    }

    private static BufferedImage orient(BufferedImage image, Orientation orientation) {
        if (orientation == null || orientation == Orientation.TOP_LEFT) return image;
        return ExifFilterUtils.getFilterForOrientation(orientation).apply(image);
    }

    /** JPEG has no transparency; without a white background transparent areas would turn black. */
    private static BufferedImage flatten(BufferedImage image) {
        if (!image.getColorModel().hasAlpha()) return image;
        BufferedImage rgb = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, rgb.getWidth(), rgb.getHeight());
        g.drawImage(image, 0, 0, null);
        g.dispose();
        return rgb;
    }

    private static byte[] encode(BufferedImage image, double quality) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Thumbnails.of(image).scale(1.0).imageType(BufferedImage.TYPE_INT_RGB)
                .outputFormat("jpg").outputQuality(quality).toOutputStream(out);
        return out.toByteArray();
    }

    private static BadRequestException unsupported() {
        return new BadRequestException("Unsupported or damaged image; please use JPEG or PNG");
    }

    private <T> T oneAtATime(Supplier<T> work) {
        try {
            permit.acquire();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting to process a photo", e);
        }
        try {
            return work.get();
        } finally {
            permit.release();
        }
    }
}
