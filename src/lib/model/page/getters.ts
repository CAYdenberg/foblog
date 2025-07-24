import { Repository } from "../../../storage/db.ts";
import { page } from "./page.ts";

export const getPage = Repository(page).get;
