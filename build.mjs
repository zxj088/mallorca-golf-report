import { cp, mkdir, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await cp("docs", "dist/assets", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");

const worker = `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      url.pathname = "/index.html";
      request = new Request(url, request);
    }
    return env.ASSETS.fetch(request);
  }
};
`;

await writeFile("dist/server/index.js", worker);
