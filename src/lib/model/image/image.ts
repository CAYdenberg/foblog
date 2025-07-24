import { IM, z } from "../../../deps.ts";
import { config } from "../../../plugin/config.ts";
import { Model } from "../Model.ts";
import type { Attachment } from "../Model.ts";

type IMagickImage = IM.IMagickImage;
const ImageMagick = IM.ImageMagick;

await IM.initialize();

const extensions = [".png", ".jpg", ".jpeg", ".bmp", ".webp"] as const;

const isAllowedFormat = (
  extension: string,
): extension is typeof extensions[number] => {
  // here we are confirming that the input fits within the enum
  // deno-lint-ignore no-explicit-any
  return extensions.includes(extension as any);
};

export const ImageSchema = z.object({
  slug: z.string(),
  filename: z.string(),
  extension: z.enum(extensions),
  variants: z.array(z.string()).optional(),
});

export type ImageTy = z.infer<typeof ImageSchema>;

const generateImageSizes = (
  data: Uint8Array,
  sizes: number[],
  emitSize?: (size: number, data: Uint8Array) => void,
): Promise<number[]> => {
  return new Promise((resolve) => {
    ImageMagick.read(data, (img: IMagickImage) => {
      const aspectRatio = img.width / img.height;

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

      resolve(outsizes);
    });
  });
};

export const image: Model<ImageTy> = {
  name: "image",
  schema: ImageSchema,

  resourcesFromFile: (file) => {
    if (!isAllowedFormat(file.extension)) return null;
    const slug = file.defaultSlug;
    return {
      filename: file.filename,
      extension: file.extension,
      slug,
    };
  },

  getAttachments: async (_resource, file) => {
    let attachments: Attachment[] = [];
    await generateImageSizes(
      file.data,
      config.images.sizes,
      (size: number, data: Uint8Array) => {
        const attachment: Attachment = { variant: `${size}`, data };
        attachments = [...attachments, attachment];
      },
    );
    return attachments;
  },
};
