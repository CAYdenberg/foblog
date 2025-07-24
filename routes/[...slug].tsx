import { PageProps } from "$fresh/server.ts";
import { PageHandler, PageHandlerProps } from "foblog";

export const handler = PageHandler();

export default function (props: PageProps<PageHandlerProps>) {
  return <h1>{props.data.page.title}</h1>;
}
