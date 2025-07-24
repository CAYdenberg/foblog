import { FunctionComponent } from "preact";
import { useWindowWidth } from "../hooks/useWindowWidth.ts";

export const Network: FunctionComponent = () => {
  const width = useWindowWidth();

  return (
    <hr
      class="hidden sm:block my-4 h-64 border-none bg-fixed bg-cover"
      style={{
        backgroundImage: `url(/image/mycelium?w=${width})`,
      }}
    />
  );
};
