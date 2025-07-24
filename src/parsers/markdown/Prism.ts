import Prism from "https://esm.sh/prismjs@1.29.0";
import typescript from "https://esm.sh/v131/prismjs@1.29.0/denonext/components/prism-typescript.js";
import jsx from "https://esm.sh/v131/prismjs@1.29.0/es2022/components/prism-jsx.min.js";
import tsx from "https://esm.sh/v131/prismjs@1.29.0/denonext/components/prism-tsx.js";
import type { MdastNodeTy } from "./index.ts";
import { warn } from "../../log.ts";

Prism.languages.typescript = typescript;
Prism.languages.PrismJsx = jsx;
Prism.languages.PrismTsx = tsx;

export default (
  code: string | undefined,
  lang: MdastNodeTy.Lang | undefined,
) => {
  if (!code) return "";
  if (!lang) return code;

  try {
    return Prism.highlight(code, Prism.languages[lang], lang);
  } catch (_err) {
    warn("Prism highlighting failed");
    return code;
  }
};
