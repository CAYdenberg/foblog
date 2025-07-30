import { FunctionComponent } from "preact";
import { FobHead } from "foblog";
import type { FobHeadProps } from "foblog";
import Navbar from "./Navbar.tsx";

export const Wrapper: FunctionComponent<FobHeadProps> = (props) => {
  return (
    <>
      <FobHead {...props} />

      <Navbar />

      <div className="pb-10">
        {props.children}
      </div>
    </>
  );
};
