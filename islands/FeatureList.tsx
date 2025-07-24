import { useCallback, useState } from "preact/hooks";
import type { FunctionComponent } from "preact";

export const FeatureList = () => {
  return (
    <ul class="text-lg text-success font-bold">
      <Item checked>
        JSONFeed instead of RSS
      </Item>
      <Item>
        Webmentions instead of pingbacks or trackbacks
      </Item>
      <Item>
        Syndication via ActivityPub
      </Item>
      <Item checked>
        HTML metadata for sharing links on platform social media or on chat
        tools (Slack, Signal)
      </Item>
      <Item checked>
        Semantic markup instead of SEO wizardry
      </Item>
      <Item checked>
        Server-first rendering instead of overly complex JavaScript view
        libraries
      </Item>
    </ul>
  );
};

const Item: FunctionComponent<{ checked?: boolean }> = (
  { children, checked },
) => {
  const [inView, setInView] = useState(false);

  const ref = useCallback((el: HTMLLIElement | null) => {
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
      },
      {
        rootMargin: "-50%",
      },
    );
    observer.observe(el);
  }, []);

  return (
    <li class="flex flex-row" ref={ref}>
      <svg
        width={20}
        height={20}
        class={`inline-block mr-2 mt-1 transition-opacity duration-1000 ${
          inView ? "opacity-100" : "opacity-0"
        }`}
      >
        <circle
          r={8}
          stroke-width={2}
          cx={10}
          cy={10}
          class="stroke-info fill-none"
        />
        {checked
          ? (
            <circle
              r={5}
              stroke-width={2}
              cx={10}
              cy={10}
              class="fill-success stroke-success"
            />
          )
          : null}
      </svg>
      <span>{children}</span>
    </li>
  );
};
