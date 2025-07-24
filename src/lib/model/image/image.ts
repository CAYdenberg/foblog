import { IM, slugify, z } from "../../../deps.ts";
import { config } from "../../../plugin/config.ts";
import { getAttachmentPath } from "../../../storage/disk.ts";
import { Model } from "../Model.ts";

type IMagickImage = IM.IMagickImage;
const ImageMagick = IM.ImageMagick;

await IM.initialize();

export const ImageSchema = z.object({
  slug: z.string(),
  originalFilename: z.string(),
  width: z.number(),
  height: z.number(),
  aspectRatio: z.number(),
  format: z.enum(["jpg", "png", "bmp", "webp", "unknown"]),
  sizes: z.array(z.object({
    size: z.number(),
    filename: z.string(),
  })),
});

export type ImageTy = z.infer<typeof ImageSchema>;

export type ImageMetadataTy = Omit<
  z.infer<typeof ImageSchema>,
  "originalFilename" | "sizes" | "slug"
>;

const getFormat = (magicFormat: IM.MagickFormat) => {
  switch (magicFormat) {
    case "PNG":
      return "png";
    case "JPG":
    case "JPEG":
      return "jpg";
    case "BMP":
      return "bmp";
    case "WEBP":
      return "webp";
  }
  return "unknown";
};

const extensions = [".png", ".jpg", ".jpeg", ".bmp", ".webp"];

const generateImageSizes = (
  data: Uint8Array,
  sizes: number[],
  emitSize?: (size: number, data: Uint8Array) => void,
): Promise<{ metadata: ImageMetadataTy; sizes: number[] }> => {
  return new Promise((resolve) => {
    ImageMagick.read(data, (img: IMagickImage) => {
      const format = getFormat(img.format);
      const aspectRatio = img.width / img.height;
      const metadata: ImageMetadataTy = {
        width: img.width,
        height: img.height,
        format,
        aspectRatio,
      };

      let outsizes: number[] = [];

      if (emitSize) {
        [img.width, ...sizes].sort((a, b) => b - a).forEach((size) => {
          if (size > img.width) return;
          img.resize(size, size / aspectRatio);
          outsizes = [...outsizes, size];
          img.write(img.format, (data) => {
            emitSize(size, data);
          });
        });
      }

      resolve({ metadata, sizes: outsizes });
    });
  });
};

export const image: Model<ImageTy> = {
  name: "image",
  schema: ImageSchema,

  onRead: async (file) => {
    if (!extensions.includes(file.extension.toLowerCase())) return null;
    const slug = slugify(file.filename);

    const getFilename = (size: number) => `${slug}_${size}${file.extension}`;
    const emitSize = (size: number, data: Uint8Array) => {
      const path = getAttachmentPath(getFilename(size));
      if (!path) return;
      Deno.writeFile(path, data);
    };

    const data = await generateImageSizes(
      file.data,
      config.images.sizes,
      emitSize,
    );

    return {
      ...data.metadata,
      sizes: data.sizes.map((size) => ({
        size,
        filename: getFilename(size),
      })),
      slug,
      originalFilename: `${file.filename}${file.extension}`,
    };
  },
};
