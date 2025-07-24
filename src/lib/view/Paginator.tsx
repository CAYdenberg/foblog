import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Icon,
} from "./icons.tsx";
import { classNames as cn } from "./formatters.ts";
import type { FunctionComponent } from "preact";
import { Pagination } from "../model/index.ts";

export interface PaginatorProps extends Pagination {
  className?: {
    root?: string;
    button?: string;
    disabledButton?: string;
    text?: string;
  };
}

export const Paginator: FunctionComponent<PaginatorProps> = (
  { url, summary, className },
) => {
  return (
    <div className={cn(className?.root, "fob-paginator")}>
      <a href={url.first || undefined}>
        <Icon icon={ChevronFirst} />
      </a>
      <a href={url.prev || undefined}>
        <Icon icon={ChevronLeft} />
      </a>
      <p className={cn(className?.text, "fob-paginator-text")}>
        <span>Showing items</span> <span>{summary.from}—{summary.to}</span>
        {summary.of ? <span>{` `} of {summary.of}.</span> : <span>.</span>}
      </p>
      <a href={url.next || undefined}>
        <Icon icon={ChevronRight} />
      </a>
      <a href={url.last || undefined}>
        <Icon icon={ChevronLast} />
      </a>
    </div>
  );
};
