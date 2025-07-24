import type { LucideProps } from "npm:lucide-preact@0.525.0";
import type { FunctionComponent } from "../../deps.ts";

export { ChevronFirst } from "npm:lucide-preact@0.525.0";
export { ChevronLast } from "npm:lucide-preact@0.525.0";
export { ChevronLeft } from "npm:lucide-preact@0.525.0";
export { ChevronRight } from "npm:lucide-preact@0.525.0";

interface Props {
  // deno-lint-ignore no-explicit-any
  icon: any;
  className?: string;
}

export const Icon: FunctionComponent<Props & LucideProps> = (props) => {
  const LucideComponent = props.icon;

  return (
    <i className={props.className}>
      <LucideComponent {...props} />
    </i>
  );
};
