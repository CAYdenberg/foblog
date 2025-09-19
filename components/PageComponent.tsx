import { PageHandlerProps } from "foblog";

export default function (props: PageHandlerProps) {
  return <h1>{props.page.title}</h1>;
}
