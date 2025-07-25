import { findPrevEntry, LsEntry } from "../storage/disk.ts";

export const ResourceFinder = () => {
  // TODO: need to figure out how to get a resource finder in this context
  const prevLs: LsEntry[] = [];
  const compareEntries = findPrevEntry(prevLs);

  return (basename: string, extension?: string) => {
    const entry = compareEntries(basename, extension || ".md");
    return entry?.resources || [];
  };
};
