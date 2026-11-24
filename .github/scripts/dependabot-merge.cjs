const { execFileSync, spawn } = require("node:child_process");
const { readFileSync } = require("node:fs");
const { createServer } = require("node:net");
const { isDeepStrictEqual } = require("node:util");

const repository = "samelliottdlt/website";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function without(object, keys) {
  return Object.fromEntries(
    Object.entries(object).filter(([key]) => !keys.includes(key)),
  );
}

const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const sections = ["dependencies", "devDependencies"];
const edgeSections = [
  "dependencies",
  "optionalDependencies",
  "peerDependencies",
];
const versionFields = ["version", "resolved", "integrity", ...edgeSections];

// Direct devDependencies that only check, format, test or describe code. Their
// majors cannot change shipped output without failing validation first.
function isToolingRoot(name) {
  return /^(@types\/.+|@typescript-eslint\/.+|typescript-eslint|@jest\/globals|jest|eslint|eslint-config-.+|eslint-plugin-.+|prettier|typescript|@typescript\/native)$/.test(
    name,
  );
}

function parseVersion(version) {
  const match = String(version).match(semver);
  assert(match, "Only stable semver versions are eligible.");
  const parts = match.slice(1).map(Number);
  assert(parts.every(Number.isSafeInteger), "Invalid semver number.");
  return parts;
}

// Returns whether a strictly newer stable version is semver-compatible.
function compareForward(before, after) {
  const [oldMajor, oldMinor, oldPatch] = parseVersion(before);
  const [newMajor, newMinor, newPatch] = parseVersion(after);
  const newer =
    newMajor > oldMajor ||
    (newMajor === oldMajor &&
      (newMinor > oldMinor || (newMinor === oldMinor && newPatch > oldPatch)));
  assert(newer, "Downgrades and non-forward updates need human review.");
  return newMajor === oldMajor && (oldMajor !== 0 || newMinor === oldMinor);
}

function compareRange(before, after) {
  const pattern = /^([~^]?)(.+)$/;
  const [, oldOperator, oldVersion] = String(before).match(pattern) ?? [];
  const [, newOperator, newVersion] = String(after).match(pattern) ?? [];
  assert(oldOperator === newOperator, "Dependency range operators changed.");
  return compareForward(oldVersion, newVersion);
}

function resolvePath(packages, from, name) {
  let base = from;
  for (;;) {
    const candidate = `${base ? `${base}/` : ""}node_modules/${name}`;
    if (packages[candidate]) return candidate;
    if (!base) return undefined;
    const index = base.lastIndexOf("/node_modules/");
    base = index === -1 ? "" : base.slice(0, index);
  }
}

function reachable(packages, names) {
  const seen = new Set();
  const queue = names.map((name) => resolvePath(packages, "", name));
  while (queue.length > 0) {
    const path = queue.pop();
    if (!path || seen.has(path)) continue;
    seen.add(path);
    for (const section of edgeSections) {
      for (const name of Object.keys(packages[path][section] ?? {})) {
        queue.push(resolvePath(packages, path, name));
      }
    }
  }
  return seen;
}

// A locked package is tooling-only when no runtime or build-affecting direct
// dependency can reach it through installed dependency or peer edges.
function toolingOnlyPaths(lock) {
  const root = lock.packages[""];
  const direct = [
    ...Object.keys(root.dependencies ?? {}),
    ...Object.keys(root.optionalDependencies ?? {}),
    ...Object.keys(root.devDependencies ?? {}),
  ];
  for (const name of direct) {
    assert(
      resolvePath(lock.packages, "", name),
      `Lockfile is missing direct dependency ${name}.`,
    );
  }
  const shipped = reachable(
    lock.packages,
    direct.filter((name) => !isToolingRoot(name)),
  );
  const tooling = reachable(lock.packages, direct.filter(isToolingRoot));
  return new Set([...tooling].filter((path) => !shipped.has(path)));
}

function assertRegistryPackage(path, record) {
  // Bundled packages ship inside their integrity-pinned parent tarball.
  assert(
    (record.inBundle === true &&
      record.resolved === undefined &&
      record.integrity === undefined) ||
      (typeof record.resolved === "string" &&
        record.resolved.startsWith("https://registry.npmjs.org/") &&
        /^sha512-[A-Za-z0-9+/]+={0,2}$/.test(record.integrity ?? "")),
    `${path}: only integrity-pinned npm registry packages are eligible.`,
  );
  assert(
    !record.hasInstallScript,
    `${path}: packages with install scripts need human review.`,
  );
}

// Classifies a dependency update. Throws for changes that always need human
// review; returns runtime reasons for changes that need --merge-runtime.
function assessDependencyUpdate(
  baseManifest,
  headManifest,
  baseLock,
  headLock,
) {
  const runtime = [];
  const updates = [];
  assert(
    isDeepStrictEqual(
      without(baseManifest, sections),
      without(headManifest, sections),
    ),
    "Non-dependency manifest changes need human review.",
  );
  assert(
    baseLock.lockfileVersion === 3 && headLock.lockfileVersion === 3,
    "Only npm lockfile version 3 is supported.",
  );
  assert(
    isDeepStrictEqual(
      without(baseLock, ["packages"]),
      without(headLock, ["packages"]),
    ),
    "Lockfile metadata changed.",
  );
  const before = baseLock.packages;
  const after = headLock.packages;
  assert(before?.[""] && after?.[""], "Lockfile package records are missing.");
  assert(
    isDeepStrictEqual(
      without(before[""], sections),
      without(after[""], sections),
    ),
    "Root lockfile metadata changed.",
  );
  for (const [manifest, lock] of [
    [baseManifest, baseLock],
    [headManifest, headLock],
  ]) {
    for (const section of sections) {
      assert(
        isDeepStrictEqual(
          manifest[section] ?? {},
          lock.packages[""][section] ?? {},
        ),
        "Manifest and lockfile dependency ranges disagree.",
      );
    }
  }
  for (const section of sections) {
    const oldRanges = baseManifest[section] ?? {};
    const newRanges = headManifest[section] ?? {};
    assert(
      isDeepStrictEqual(
        Object.keys(oldRanges).sort(),
        Object.keys(newRanges).sort(),
      ),
      "Adding or removing direct dependencies needs human review.",
    );
    for (const name of Object.keys(oldRanges)) {
      if (oldRanges[name] === newRanges[name]) continue;
      const compatible = compareRange(oldRanges[name], newRanges[name]);
      if (
        !compatible &&
        !(section === "devDependencies" && isToolingRoot(name))
      ) {
        runtime.push(
          `${name}: major range ${oldRanges[name]} -> ${newRanges[name]}`,
        );
      }
    }
  }
  const oldTooling = toolingOnlyPaths(baseLock);
  const newTooling = toolingOnlyPaths(headLock);
  const paths = new Set([...Object.keys(before), ...Object.keys(after)]);
  paths.delete("");
  for (const path of [...paths].sort()) {
    const old = before[path];
    const next = after[path];
    if (isDeepStrictEqual(old, next)) continue;
    const tooling =
      (!old || oldTooling.has(path)) && (!next || newTooling.has(path));
    if (!old || !next) {
      if (next) assertRegistryPackage(path, next);
      if (!tooling) {
        runtime.push(`${path}: ${next ? "added" : "removed"} runtime package`);
      }
      updates.push(
        `${path}: ${old?.version ?? "added"} -> ${next?.version ?? "removed"}`,
      );
      continue;
    }
    assertRegistryPackage(path, old);
    assertRegistryPackage(path, next);
    assert(old.license === next.license, `${path}: license changed.`);
    const sameVersion = old.version === next.version;
    assert(
      !sameVersion ||
        (old.resolved === next.resolved && old.integrity === next.integrity),
      `${path}: tarball changed without a version change.`,
    );
    const compatible = sameVersion || compareForward(old.version, next.version);
    if (!tooling) {
      if (!compatible) {
        runtime.push(`${path}: major ${old.version} -> ${next.version}`);
      }
      if (
        !isDeepStrictEqual(
          without(old, versionFields),
          without(next, versionFields),
        )
      ) {
        runtime.push(`${path}: package metadata changed`);
      }
      for (const section of edgeSections) {
        const oldEdges = old[section] ?? {};
        const newEdges = next[section] ?? {};
        const sameNames = isDeepStrictEqual(
          Object.keys(oldEdges).sort(),
          Object.keys(newEdges).sort(),
        );
        const compatibleEdges =
          sameNames &&
          Object.keys(oldEdges).every((name) => {
            if (oldEdges[name] === newEdges[name]) return true;
            try {
              return compareRange(oldEdges[name], newEdges[name]);
            } catch {
              return false;
            }
          });
        if (!compatibleEdges) {
          runtime.push(`${path}: ${section} changed`);
        }
      }
    }
    updates.push(`${path}: ${old.version} -> ${next.version}`);
  }
  assert(updates.length > 0, "No locked package version update was found.");
  return { updates, runtime: [...new Set(runtime)] };
}

const repairPaths = /^(app|components|hooks|lib)\/(?!(.*\/)?AGENTS\.md$)/;
const maxRepairLines = 300;
const maxRepairCommits = 3;

// Classifies PR files and commits. Bounded source repairs on runtime code need
// --merge-runtime; everything else outside package files needs human review.
function assessPullRequestChanges(files, commits) {
  assert(files.length > 0, "The PR has no changed files.");
  let repairLines = 0;
  for (const file of files) {
    if (["package.json", "package-lock.json"].includes(file.filename)) {
      assert(file.status === "modified", `${file.filename} must be modified.`);
      continue;
    }
    assert(
      repairPaths.test(file.filename) &&
        ["added", "modified"].includes(file.status),
      `${file.filename}: only added or modified files in app/, components/, hooks/ or lib/ may be repaired.`,
    );
    repairLines += file.additions + file.deletions;
  }
  assert(
    repairLines <= maxRepairLines,
    `Source repairs over ${maxRepairLines} changed lines need human review.`,
  );
  const repairs = commits.filter(
    (commit) => commit.author?.login !== "dependabot[bot]",
  );
  assert(
    repairs.every((commit) => commit.commit.message.startsWith("fix(deps):")),
    "Only Dependabot and fix(deps): repair commits are eligible.",
  );
  assert(
    repairs.length <= maxRepairCommits,
    `More than ${maxRepairCommits} repair commits need human review.`,
  );
  return repairs.length > 0
    ? [
        `${repairs.length} fix(deps): repair commits changing ${repairLines} source lines`,
      ]
    : [];
}

function assertPullRequest(pull, sha, baseSha) {
  assert(
    pull.state === "open" &&
      !pull.draft &&
      pull.user?.login === "dependabot[bot]" &&
      pull.head?.repo?.full_name === repository &&
      pull.head?.ref?.startsWith("dependabot/") &&
      pull.base?.repo?.full_name === repository &&
      pull.base?.ref === "main",
    "Expected an open, same-repository Dependabot PR targeting main.",
  );
  assert(pull.head.sha === sha, "PR head changed; discard prior validation.");
  assert(pull.base.sha === baseSha, "Main changed; discard prior validation.");
  assert(
    pull.mergeable === true && pull.mergeable_state === "clean",
    "PR is not cleanly mergeable with required branch protections satisfied.",
  );
  assert(
    pull.requested_reviewers?.length === 0 &&
      pull.requested_teams?.length === 0,
    "A human review is requested.",
  );
}

function assertCleanStatus(status, afterBuild = false) {
  const changes = status.split(/\r?\n/).filter(Boolean);
  assert(
    changes.every((line) => afterBuild && line === " M next-env.d.ts"),
    "The working tree must be clean; only Next.js-generated next-env.d.ts may change during validation.",
  );
  return changes.length > 0;
}

function gh(path, ...args) {
  return JSON.parse(
    execFileSync("gh", ["api", "--hostname", "github.com", path, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    }),
  );
}

function pages(path, key) {
  return gh(path, "--paginate", "--slurp").flatMap((page) =>
    key ? page[key] : page,
  );
}

function readJson(path, sha) {
  const file = gh(`repos/${repository}/contents/${path}?ref=${sha}`);
  assert(file.encoding === "base64", `Cannot read ${path} at ${sha}.`);
  return JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
}

function inspect(prNumber, sha, expectedBase) {
  const prefix = `repos/${repository}`;
  // The branch endpoint exposes required checks without administration access.
  // The gate enforces up-to-date heads and resolved threads itself below.
  const branch = gh(`${prefix}/branches/main`);
  assert(
    branch.protected === true &&
      branch.protection?.enabled === true &&
      branch.protection.required_status_checks?.enforcement_level ===
        "everyone" &&
      branch.protection.required_status_checks.checks?.some(
        (check) => check.context === "build (24.x)" && check.app_id === 15368,
      ),
    "Main must require GitHub Actions CI for everyone, including admins.",
  );
  const pull = gh(`${prefix}/pulls/${prNumber}`);
  const baseSha = branch.commit.sha;
  assert(
    !expectedBase || baseSha === expectedBase,
    "Main changed during validation.",
  );
  assertPullRequest(pull, sha, baseSha);
  const reviews = new Map();
  for (const review of pages(
    `${prefix}/pulls/${prNumber}/reviews?per_page=100`,
  )) {
    if (["APPROVED", "CHANGES_REQUESTED", "DISMISSED"].includes(review.state)) {
      reviews.set(review.user.login, review.state);
    }
  }
  assert(
    ![...reviews.values()].includes("CHANGES_REQUESTED"),
    "A reviewer requested changes.",
  );
  const threads = gh(
    "graphql",
    "-f",
    `query=query{repository(owner:"samelliottdlt",name:"website"){pullRequest(number:${prNumber}){reviewThreads(first:100){totalCount nodes{isResolved}}}}}`,
  ).data.repository.pullRequest.reviewThreads;
  assert(
    threads.totalCount === threads.nodes.length &&
      threads.nodes.every((thread) => thread.isResolved),
    "Unresolved review conversations need human attention.",
  );
  const comparison = gh(`${prefix}/compare/${baseSha}...${sha}`);
  assert(
    comparison.behind_by === 0,
    "PR is behind main; request a branch update and wait for fresh CI.",
  );
  const files = pages(`${prefix}/pulls/${prNumber}/files?per_page=100`);
  assert(files.length < 3000, "The PR file list is too large to inspect.");
  const commits = pages(`${prefix}/pulls/${prNumber}/commits?per_page=100`);
  assert(commits.length < 250, "The PR commit list is too large to inspect.");
  const repairs = assessPullRequestChanges(files, commits);
  const checks = pages(
    `${prefix}/commits/${sha}/check-runs?per_page=100`,
    "check_runs",
  );
  const latest = new Map();
  for (const check of checks.sort((a, b) => a.id - b.id)) {
    latest.set(`${check.app?.id}:${check.name}`, check);
  }
  assert(
    [...latest.values()].some(
      (check) =>
        check.name === "build (24.x)" &&
        check.app?.slug === "github-actions" &&
        check.status === "completed" &&
        check.conclusion === "success",
    ),
    "Successful Node.js CI is required on the exact PR head.",
  );
  assert(
    [...latest.values()].every(
      (check) =>
        check.status === "completed" &&
        ["success", "neutral", "skipped"].includes(check.conclusion),
    ),
    "A check is failing, pending, or requires human action.",
  );
  const statuses = gh(`${prefix}/commits/${sha}/status`);
  assert(
    statuses.statuses.length === 0 || statuses.state === "success",
    "A commit status is failing or pending.",
  );
  const { updates, runtime } = assessDependencyUpdate(
    readJson("package.json", baseSha),
    readJson("package.json", sha),
    readJson("package-lock.json", baseSha),
    readJson("package-lock.json", sha),
  );
  return { baseSha, updates, runtime: [...runtime, ...repairs] };
}

// Static routes from the production build manifests, including prerendered
// dynamic routes such as blog posts.
function smokeRoutes(dir = ".next") {
  const read = (name) =>
    JSON.parse(readFileSync(`${dir}/${name}`, { encoding: "utf8" }));
  const routes = new Set([
    ...Object.values(read("app-path-routes-manifest.json")),
    ...Object.keys(read("prerender-manifest.json").routes),
  ]);
  return [...routes]
    .filter((route) => !route.includes("[") && !route.startsWith("/_"))
    .sort();
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function smokeTest() {
  const routes = smokeRoutes();
  assert(routes.includes("/"), "The production build has no home route.");
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const server = spawn(
    process.execPath,
    [
      require.resolve("next/dist/bin/next", { paths: [process.cwd()] }),
      "start",
      "-H",
      "127.0.0.1",
      "-p",
      String(port),
    ],
    { stdio: ["ignore", "inherit", "inherit"] },
  );
  try {
    const deadline = Date.now() + 30_000;
    for (;;) {
      assert(server.exitCode === null, "The production server exited.");
      try {
        await fetch(origin, { signal: AbortSignal.timeout(2_000) });
        break;
      } catch {
        assert(Date.now() < deadline, "The production server did not start.");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    for (const route of routes) {
      const response = await fetch(`${origin}${route}`, {
        signal: AbortSignal.timeout(15_000),
      });
      await response.arrayBuffer();
      assert(
        response.status === 200 && response.url.startsWith(`${origin}/`),
        `Smoke test failed: ${route} returned HTTP ${response.status} from ${response.url}.`,
      );
    }
    console.log(`Smoke-tested ${routes.length} production routes.`);
  } finally {
    server.kill();
  }
}

async function main() {
  const [mode, prNumber, sha] = process.argv.slice(2);
  assert(
    ["--check", "--merge", "--merge-runtime"].includes(mode) &&
      /^[1-9]\d*$/.test(prNumber ?? "") &&
      /^[a-f0-9]{40}$/.test(sha ?? "") &&
      process.argv.length === 5,
    "Usage: node dependabot-merge.cjs --check|--merge|--merge-runtime PR_NUMBER HEAD_SHA",
  );
  const { baseSha, updates, runtime } = inspect(prNumber, sha);
  console.log(updates.join("\n"));
  if (runtime.length > 0) {
    console.log(
      `Runtime-affecting changes (require --merge-runtime after browser smoke testing):\n${runtime.join("\n")}`,
    );
  } else {
    console.log("Tier: automatic (no runtime-affecting changes).");
  }
  if (mode === "--check") return;
  assert(
    runtime.length === 0 || mode === "--merge-runtime",
    "Runtime-affecting changes need browser smoke testing and --merge-runtime.",
  );
  assert(
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() ===
      sha,
    "The working tree must be checked out at the exact PR head.",
  );
  const assertClean = (afterBuild = false) =>
    assertCleanStatus(
      execFileSync("git", ["status", "--porcelain"], {
        encoding: "utf8",
      }),
      afterBuild,
    );
  assertClean();
  for (const args of [
    ["ci"],
    ["run", "prettier"],
    ["run", "lint"],
    ["run", "typecheck"],
    ["test", "--", "--runInBand"],
    ["run", "build"],
  ]) {
    // On Windows npm is a .cmd shim; every argument here is a fixed literal.
    execFileSync("npm", args, {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
  }
  await smokeTest();
  if (assertClean(true)) {
    console.log("Next.js regenerated next-env.d.ts; no source files changed.");
  }
  const recheck = inspect(prNumber, sha, baseSha);
  assert(
    isDeepStrictEqual(recheck.runtime, runtime),
    "The merge tier changed during validation.",
  );
  const result = gh(
    `repos/${repository}/pulls/${prNumber}/merge`,
    "--method",
    "PUT",
    "-f",
    "merge_method=squash",
    "-f",
    `sha=${sha}`,
  );
  assert(result.merged === true, result.message || "GitHub refused the merge.");
  console.log(`Merged ${repository}#${prNumber} at ${sha}.`);
}

module.exports = {
  assessDependencyUpdate,
  assessPullRequestChanges,
  assertPullRequest,
  assertCleanStatus,
  smokeRoutes,
  smokeTest,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
