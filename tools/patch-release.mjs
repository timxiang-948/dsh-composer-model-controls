import fs from "node:fs";

const token = process.env.GITHUB_TOKEN;
const notesPath = process.argv[2];
const releaseId = process.argv[3];
const repo = "timxiang-948/dsh-composer-model-controls";

if (!token) {
  console.error("GITHUB_TOKEN is required");
  process.exit(1);
}

const raw = fs.readFileSync(notesPath, "utf8");
const split = raw.indexOf("\n---\n");
if (split < 0) {
  console.error("notes file must contain a name line, then ---, then body");
  process.exit(1);
}
const name = raw.slice(0, split).trim();
const body = raw.slice(split + 5).replace(/^\n+/, "");

const response = await fetch(`https://api.github.com/repos/${repo}/releases/${releaseId}`, {
  method: "PATCH",
  headers: {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json; charset=utf-8",
    "User-Agent": "dsh-agent",
  },
  body: JSON.stringify({ name, body }),
});

if (!response.ok) {
  console.error("PATCH failed", response.status, await response.text());
  process.exit(1);
}

const json = await response.json();
console.log("name=" + json.name);
console.log("bodyLength=" + json.body.length);
console.log("bodyHead=" + json.body.slice(0, 80).replace(/\n/g, " "));
console.log("assets=" + json.assets.map((asset) => `${asset.name}:${asset.size}:${asset.state}`).join(","));
