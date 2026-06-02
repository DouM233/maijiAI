import Script from "next/script";
import { RawMarkup } from "../components/prototype/RawMarkup";
import { getPrototypeTemplate } from "../lib/prototype-template";

export default function HomePage() {
  const template = getPrototypeTemplate();

  return (
    <>
      <RawMarkup html={template.appShell} />
      <Script id="maiji-experts" strategy="afterInteractive">
        {template.expertsScript}
      </Script>
      <Script id="maiji-departments" strategy="afterInteractive">
        {template.departmentsScript}
      </Script>
      <Script id="maiji-agents" strategy="afterInteractive">
        {template.agentsScript}
      </Script>
      <Script id="maiji-tool-links" strategy="afterInteractive">
        {template.toolLinksScript}
      </Script>
      <Script id="maiji-app" strategy="afterInteractive">
        {template.appScript}
      </Script>
    </>
  );
}
