import { IM, z } from "../../../deps.ts";
import { config } from "../../../plugin/config.ts";
import { Model } from "../Model.ts";

type IMagickImage = IM.IMagickImage;
const ImageMagick = IM.ImageMagick;

const extensions = [".png", ".jpg", ".jpeg", ".bmp", ".webp"] as const;

await IM.initialize();

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
  getDestPath: (variant: string) => string,
): Promise<string[]> => {
  return new Promise((resolve) => {
    ImageMagick.read(data, (img: IMagickImage) => {
      const aspectRatio = img.width / img.height;

      let outsizes: string[] = [];

      const recur = (sizes: number[]) => {
        if (!sizes.length) {
          return resolve(outsizes);
        }
        const [head, ...tail] = sizes;
        if (head > img.width) {
          return recur(tail);
        }
        outsizes = [...outsizes, head.toString()];
        img.resize(head, head / aspectRatio);
        img.write(img.format, (data) => {
          Deno.writeFileSync(getDestPath(head.toString()), data);
          recur(tail);
        });
      };

      const sizesDesc: number[] = [img.width, ...sizes].sort((a, b) => b - a);
      recur(sizesDesc);
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

  getAttachments: async (_resource, file, getDestPath) => {
    const sizes = await generateImageSizes(
      file.data,
      config.images.sizes,
      getDestPath,
    );
    return sizes;
  },
};
