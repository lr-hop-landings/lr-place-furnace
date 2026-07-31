import { mkdir, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

const serverDir = join(process.cwd(), "dist", "server");
const workerPath = join(serverDir, "index.js");
const buildDir = join(process.cwd(), "dist");
const clientDir = join(buildDir, "client");

await mkdir(clientDir, { recursive: true });
for (const entry of await readdir(buildDir)) {
  if (entry === "client" || entry === "server") continue;
  await rename(join(buildDir, entry), join(clientDir, entry));
}

await mkdir(serverDir, { recursive: true });
await writeFile(
  workerPath,
  `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;

    const url = new URL(request.url);
    if (url.pathname.includes(".") || url.pathname.endsWith("/")) return response;

    url.pathname = \`\${url.pathname}/index.html\`;
    return env.ASSETS.fetch(new Request(url, request));
  },
};
`,
);
