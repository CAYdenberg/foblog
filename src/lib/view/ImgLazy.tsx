import { FunctionComponent } from "preact";
import { useLayoutEffect, useRef, useState } from "preact/hooks";

import { classNames } from "./formatters.ts";

export interface ImgLazyProps {
  src: string;
  alt: string;
  className?: string;
}

export const ImgLazy: FunctionComponent<ImgLazyProps> = (
  { src, alt, className },
) => {
  const [requestedSize, setRequestedSize] = useState(1);

  const srcWithQuery = `${src}?width=${requestedSize}`;

  const imgRef = useRef<HTMLImageElement>(null);
  useLayoutEffect(() => {
    function fire() {
      setRequestedSize(imgRef.current?.parentElement?.clientWidth || 1);
    }
    fire();

    self.addEventListener("resize", fire);
    return () => {
      self.removeEventListener("resize", fire);
    };
  });

  return (
    <img
      ref={imgRef}
      alt={alt}
      src={srcWithQuery}
      className={classNames(
        className,
        requestedSize > 1 ? "fob-img-loaded" : "fob-img-lazy",
      )}
    />
  );
};
