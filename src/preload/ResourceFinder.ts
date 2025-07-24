import { findPrevEntry, LsRepository } from "../storage/disk.ts";

export const ResourceFinder = async () => {
  const prevLs = await LsRepository.get("ls");
  if (!prevLs) {
    throw new Error("System build not completed");
  }
  const compareEntries = findPrevEntry(prevLs);

  return (basename: string, extension?: string) => {
    const entry = compareEntries(basename, extension || ".md");
    return entry?.resources || [];
  };
};
