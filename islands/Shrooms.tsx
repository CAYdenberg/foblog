import { FunctionComponent } from "preact";
import { useCallback } from "preact/hooks";
import { useWindowWidth } from "../hooks/useWindowWidth.ts";

export const Shrooms: FunctionComponent = () => {
  const width = useWindowWidth();

  const ref = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        document.body.classList.add("scrolled");
      },
    );
    observer.observe(el);
  }, []);

  return (
    <hr
      ref={ref}
      class="hidden sm:block my-4 h-32 border-none bg-center bg-cover"
      style={{
        backgroundImage: `url(/image/mushrooms1?width=${
          typeof width === "number" ? width : 200
        })`,
      }}
    />
  );
};
