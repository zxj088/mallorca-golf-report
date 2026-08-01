import Script from "next/script";
import pageSource from "../docs/index.html?raw";

const bodyContent =
  pageSource
    .match(/<body>([\s\S]*?)<script[^>]+src="\.\/app\.js[^>]*><\/script>\s*<\/body>/)?.[1]
    ?.trim() ?? "";

export default function HomePage() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
      <Script src="/app.js?v=20260801-lodging" strategy="afterInteractive" />
    </>
  );
}
