import { IS_BROWSER } from "$fresh/runtime.ts";

import { useEffect, useState } from "preact/hooks";

export const useWindowWidth = () => {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    if (!IS_BROWSER) return;

    const width = globalThis.innerWidth;
    setWidth(width);
  }, []);

  return width;
};
