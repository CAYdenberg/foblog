import { FunctionComponent } from "preact";
import { ImageTy } from "../model/index.ts";
import { config } from "../../plugin/config.ts";

export interface ImgLazyProps {
  image: ImageTy | null;
  alt: string;
  className?: string;
}

export const ImgLazy: FunctionComponent<ImgLazyResponsiveProps> = (
  { image, alt, sizes, className },
) => {
  if (!image) return null;

  const sizesAsc = image.sizes.slice().sort((a, b) => a.size - b.size);
  const src = config.images.permalink(image.slug);
  const srcset = sizesAsc.length
    ? sizesAsc.map((size) =>
      `${config.images.permalink(image.slug, size.size)} ${size.size}w`
    ).join(",")
    : undefined;

  return (
    <img
      alt={alt}
      src={src}
      srcset={srcset}
      sizes={sizes}
      className={className}
    />
  );
};
