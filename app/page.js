import fs from "node:fs";
import path from "node:path";
import Script from "next/script";

function readFile(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function extractAppShell(html) {
  const match = html.match(/<main class="app-shell">[\s\S]*<\/main>/);
  return match ? match[0] : "";
}

function stripScriptTags(markup) {
  return markup.replace(/<script[\s\S]*?<\/script>/g, "").trim();
}

export default function HomePage() {
  const indexHtml = readFile("index.html");
  const expertsScript = readFile(path.join("data", "experts.js"));
  const departmentsScript = readFile(path.join("data", "departments.js"));
  const appScript = readFile("app.js");
  const prototypeMarkup = stripScriptTags(extractAppShell(indexHtml));

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: prototypeMarkup }} />
      <Script id="maiji-experts" strategy="afterInteractive">
        {expertsScript}
      </Script>
      <Script id="maiji-departments" strategy="afterInteractive">
        {departmentsScript}
      </Script>
      <Script id="maiji-app" strategy="afterInteractive">
        {appScript}
      </Script>
    </>
  );
}
