import { Fragment, type FunctionComponent, Head } from "../../deps.ts";
import { config } from "../../plugin/config.ts";

export interface FobHeadProps {
  url: URL | string | null;
  pageTitle?: string;
  pageDescription?: string;
  pageSocialImage?: string;
}

export const FobHead: FunctionComponent<FobHeadProps> = (props) => {
  const title = props.pageTitle
    ? `${props.pageTitle} | ${config.siteTitle}`
    : config.siteTitle;
  const url = typeof props.url === "string" ? new URL(props.url) : props.url;
  const description = props.pageDescription || config.siteDescription;
  const canonical = `${config.siteUrl}${url?.pathname}`;

  const image = props.pageSocialImage;

  return (
    <Head>
      <title>{title}</title>

      <meta name="description" content={description} />

      {props.url ? <link rel="canonical" href={canonical} /> : null}

      {config.posts.feedUrl
        ? (
          <link
            rel="alternate"
            type="application/json"
            href={config.posts.feedUrl}
          />
        )
        : null}

      <link rel="shortcut icon" href="/favicon.svg" type="image/x-icon" />

      <meta name="og:type" content="website" />
      <meta name="og:title" content={title} />
      <meta name="og:url" content={canonical} />
      <meta name="og:description" content={description} />
      {image
        ? (
          <Fragment>
            <meta
              name="og:image"
              content={`${config.siteUrl}${image}?width=1200`}
            />
            <meta name="og:image:alt" content={description} />
          </Fragment>
        )
        : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content={config.siteUrl} />
      <meta property="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image
        ? (
          <Fragment>
            <meta
              name="twitter:image"
              content={`${config.siteUrl}${image}?width=1200`}
            />
          </Fragment>
        )
        : null}

      <link rel="stylesheet" type="text/css" href="/styles.css" />
    </Head>
  );
};
