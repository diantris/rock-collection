package com.rockcollection.photo;

import com.rockcollection.common.BadRequestException;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.zip.CRC32;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ImageProcessorTest {
    private final ImageProcessor processor = new ImageProcessor();

    @Test
    void webPhoto_largeImage_isShrunkToFit() throws IOException {
        ImageProcessor.Image result = processor.toWebPhoto(encode(image(4000, 3000, BufferedImage.TYPE_INT_RGB), "jpg"));

        assertThat(result.width()).isEqualTo(1600);
        assertThat(result.height()).isEqualTo(1200);
        assertThat(decode(result.data()).getWidth()).isEqualTo(1600);
    }

    @Test
    void webPhoto_smallImage_isNotEnlarged() throws IOException {
        ImageProcessor.Image result = processor.toWebPhoto(encode(image(800, 600, BufferedImage.TYPE_INT_RGB), "jpg"));

        assertThat(result.width()).isEqualTo(800);
        assertThat(result.height()).isEqualTo(600);
    }

    @Test
    void webPhoto_appliesExifRotationAndDropsAllMetadataIncludingGps() throws IOException {
        byte[] phonePhoto = withExif(encode(image(200, 100, BufferedImage.TYPE_INT_RGB), "jpg"));
        assertThat(contains(phonePhoto, "Exif")).isTrue();

        ImageProcessor.Image result = processor.toWebPhoto(phonePhoto);

        // Orientation 6 = "rotate 90° clockwise to display", so the landscape pixels become portrait
        assertThat(result.width()).isEqualTo(100);
        assertThat(result.height()).isEqualTo(200);
        assertThat(contains(result.data(), "Exif")).isFalse();
    }

    @Test
    void webPhoto_transparentPng_getsWhiteBackground() throws IOException {
        BufferedImage transparent = new BufferedImage(50, 50, BufferedImage.TYPE_INT_ARGB); // all pixels fully transparent

        ImageProcessor.Image result = processor.toWebPhoto(encode(transparent, "png"));

        Color corner = new Color(decode(result.data()).getRGB(0, 0));
        assertThat(corner.getRed()).isGreaterThan(245);
        assertThat(corner.getGreen()).isGreaterThan(245);
        assertThat(corner.getBlue()).isGreaterThan(245);
    }

    @Test
    void webPhoto_notAnImage_isRejected() {
        assertThatThrownBy(() -> processor.toWebPhoto("definitely not a photo".getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void webPhoto_muchLargerImage_isReadSubsampledAndStillFitsExactly() throws IOException {
        // 6400 px is 4× the web size, so it's read at every 2nd pixel (3200 × 400) and then resized smoothly
        ImageProcessor.Image result = processor.toWebPhoto(encode(image(6400, 800, BufferedImage.TYPE_INT_RGB), "jpg"));
        assertThat(result.width()).isEqualTo(1600);
        assertThat(result.height()).isEqualTo(200);
    }

    @Test
    void webPhoto_absurdlyLargeImage_isRefusedBeforeDecoding() {
        // Only the PNG header: 20000 × 20000 pixels would take 1.6 GB once decoded
        assertThatThrownBy(() -> processor.toWebPhoto(pngHeader(20_000, 20_000)))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("too large").hasMessageContaining("20000 × 20000");
    }

    @Test
    void thumbnail_isSmallCenteredSquare() throws IOException {
        BufferedImage thumbnail = decode(processor.toThumbnail(encode(image(1600, 900, BufferedImage.TYPE_INT_RGB), "jpg")));

        assertThat(thumbnail.getWidth()).isEqualTo(ImageProcessor.THUMBNAIL_SIZE);
        assertThat(thumbnail.getHeight()).isEqualTo(ImageProcessor.THUMBNAIL_SIZE);
    }

    private static BufferedImage image(int width, int height, int type) {
        BufferedImage image = new BufferedImage(width, height, type);
        Graphics2D g = image.createGraphics();
        g.setColor(new Color(120, 90, 160));
        g.fillRect(0, 0, width, height);
        g.dispose();
        return image;
    }

    private static byte[] encode(BufferedImage image, String format) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, format, out);
        return out.toByteArray();
    }

    private static BufferedImage decode(byte[] bytes) throws IOException {
        return ImageIO.read(new ByteArrayInputStream(bytes));
    }

    /** A PNG signature and IHDR chunk declaring the given size, with no pixel data. */
    private static byte[] pngHeader(int width, int height) {
        ByteBuffer ihdr = ByteBuffer.allocate(17);
        ihdr.put("IHDR".getBytes(StandardCharsets.US_ASCII)).putInt(width).putInt(height)
                .put((byte) 8).put((byte) 0).put((byte) 0).put((byte) 0).put((byte) 0); // 8-bit grey
        CRC32 crc = new CRC32();
        crc.update(ihdr.array());
        ByteBuffer png = ByteBuffer.allocate(8 + 4 + 17 + 4);
        png.put(new byte[]{(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'})
                .putInt(13).put(ihdr.array()).putInt((int) crc.getValue());
        return png.array();
    }

    private static boolean contains(byte[] haystack, String needle) {
        return new String(haystack, StandardCharsets.ISO_8859_1).contains(needle);
    }

    /**
     * Inserts an EXIF (APP1) segment like a phone camera writes, right after the JFIF (APP0) segment:
     * orientation 6 and a GPS block with a latitude reference.
     */
    private static byte[] withExif(byte[] jpeg) {
        ByteBuffer tiff = ByteBuffer.allocate(64); // big-endian ("MM")
        tiff.put((byte) 'M').put((byte) 'M').putShort((short) 42).putInt(8);
        // IFD0: orientation, and a pointer to the GPS IFD at offset 38
        tiff.putShort((short) 2);
        tiff.putShort((short) 0x0112).putShort((short) 3).putInt(1).putShort((short) 6).putShort((short) 0);
        tiff.putShort((short) 0x8825).putShort((short) 4).putInt(1).putInt(38);
        tiff.putInt(0);
        // GPS IFD: GPSLatitudeRef = "N"
        tiff.putShort((short) 1);
        tiff.putShort((short) 0x0001).putShort((short) 2).putInt(2).put((byte) 'N').put((byte) 0).putShort((short) 0);
        tiff.putInt(0);
        byte[] tiffBytes = new byte[tiff.position()];
        tiff.flip().get(tiffBytes);

        byte[] header = "Exif\0\0".getBytes(StandardCharsets.ISO_8859_1);
        int length = 2 + header.length + tiffBytes.length;
        ByteBuffer app1 = ByteBuffer.allocate(2 + length);
        app1.put((byte) 0xFF).put((byte) 0xE1).putShort((short) length).put(header).put(tiffBytes);

        int app0End = 4 + (((jpeg[4] & 0xFF) << 8) | (jpeg[5] & 0xFF)); // SOI (2) + APP0 marker (2) + its length
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(jpeg, 0, app0End);
        out.writeBytes(app1.array());
        out.write(jpeg, app0End, jpeg.length - app0End);
        return out.toByteArray();
    }
}
