import { FunctionComponent } from "preact";
import { ImageTy, ImgLazy } from "foblog";

interface Props {
  image: ImageTy | null;
  alt: string;
  reverse?: boolean;
}

export const HalfCut: FunctionComponent<Props> = (
  { image, alt, reverse, children },
) => {
  return (
    <div
      class={`sm:flex flex-row items-stretch ${reverse && "flex-row-reverse"}`}
    >
      <div class="sm:w-[50%] bg-dark flex-shrink-0 flex-grow-1">
        <ImgLazy
          src={`/image/${image?.slug}`}
          alt={alt}
          className="object-cover w-full h-[150px] sm:h-full"
        />
      </div>
      <div class="p-8 flex-grow-0">
        {children}
      </div>
    </div>
  );
};
