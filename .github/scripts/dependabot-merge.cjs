const { execFileSync } = require("node:child_process");
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

function assertForwardCompatibleVersion(before, after, range = false) {
  const pattern = range
    ? /^([~^]?)(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/
    : /^()(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  const oldVersion = String(before).match(pattern);
  const newVersion = String(after).match(pattern);
  assert(oldVersion && newVersion, "Only stable semver versions are low risk.");
  assert(
    oldVersion[1] === newVersion[1],
    "Dependency range operators changed.",
  );
  const [oldMajor, oldMinor, oldPatch] = oldVersion.slice(2).map(Number);
  const [newMajor, newMinor, newPatch] = newVersion.slice(2).map(Number);
  assert(
    [...oldVersion.slice(2), ...newVersion.slice(2)].every((part) =>
      Number.isSafeInteger(Number(part)),
    ),
    "Invalid semver number.",
  );
  assert(
    newMajor === oldMajor &&
      (oldMajor !== 0 || newMinor === oldMinor) &&
      (newMinor > oldMinor || (newMinor === oldMinor && newPatch > oldPatch)),
    "Major, potentially breaking 0.x, or non-forward updates need human review.",
  );
}

function assertDependencyMaps(before = {}, after = {}) {
  assert(
    isDeepStrictEqual(Object.keys(before).sort(), Object.keys(after).sort()),
    "Adding or removing dependencies needs human review.",
  );
  for (const name of Object.keys(before)) {
    if (before[name] !== after[name]) {
      assertForwardCompatibleVersion(before[name], after[name], true);
    }
  }
}

function assertLowRiskUpdate(baseManifest, headManifest, baseLock, headLock) {
  const sections = ["dependencies", "devDependencies"];
  assert(
    isDeepStrictEqual(
      without(baseManifest, sections),
      without(headManifest, sections),
    ),
    "Non-dependency manifest changes need human review.",
  );
  for (const section of sections) {
    assertDependencyMaps(baseManifest[section], headManifest[section]);
  }
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
    isDeepStrictEqual(Object.keys(before).sort(), Object.keys(after).sort()),
    "Adding or removing locked packages needs human review.",
  );
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
  const updates = [];
  const packageDependencySections = ["dependencies", "optionalDependencies"];
  for (const path of Object.keys(before).filter(Boolean)) {
    if (isDeepStrictEqual(before[path], after[path])) continue;
    assert(
      isDeepStrictEqual(
        without(before[path], [
          "version",
          "resolved",
          "integrity",
          ...packageDependencySections,
        ]),
        without(after[path], [
          "version",
          "resolved",
          "integrity",
          ...packageDependencySections,
        ]),
      ),
      `${path}: package metadata changed.`,
    );
    for (const section of packageDependencySections) {
      assertDependencyMaps(before[path][section], after[path][section]);
    }
    assert(
      !before[path].hasInstallScript && !after[path].hasInstallScript,
      `${path}: packages with install scripts need human review.`,
    );
    assertForwardCompatibleVersion(before[path].version, after[path].version);
    for (const record of [before[path], after[path]]) {
      assert(
        typeof record.resolved === "string" &&
          record.resolved.startsWith("https://registry.npmjs.org/") &&
          /^sha512-[A-Za-z0-9+/]+={0,2}$/.test(record.integrity ?? ""),
        `${path}: only integrity-pinned npm registry packages are low risk.`,
      );
    }
    updates.push(`${path}: ${before[path].version} -> ${after[path].version}`);
  }
  assert(updates.length > 0, "No locked package version update was found.");
  return updates;
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
  const protection = gh(`${prefix}/branches/main/protection`);
  assert(
    protection.enforce_admins?.enabled === true &&
      protection.required_status_checks?.strict === true &&
      protection.required_status_checks.checks.some(
        (check) => check.context === "build (24.x)" && check.app_id === 15368,
      ) &&
      protection.required_conversation_resolution?.enabled === true,
    "Main must enforce up-to-date GitHub Actions CI and resolved conversations, including for admins.",
  );
  const pull = gh(`${prefix}/pulls/${prNumber}`);
  const baseSha = gh(`${prefix}/branches/main`).commit.sha;
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
  const files = pages(`${prefix}/pulls/${prNumber}/files?per_page=100`);
  assert(
    files.length > 0 &&
      files.every(
        (file) =>
          file.status === "modified" &&
          ["package.json", "package-lock.json"].includes(file.filename),
      ),
    "Only package.json and package-lock.json may change for unattended merging.",
  );
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
  const updates = assertLowRiskUpdate(
    readJson("package.json", baseSha),
    readJson("package.json", sha),
    readJson("package-lock.json", baseSha),
    readJson("package-lock.json", sha),
  );
  return { baseSha, updates };
}

function main() {
  const [mode, prNumber, sha] = process.argv.slice(2);
  assert(
    ["--check", "--merge"].includes(mode) &&
      /^[1-9]\d*$/.test(prNumber ?? "") &&
      /^[a-f0-9]{40}$/.test(sha ?? "") &&
      process.argv.length === 5,
    "Usage: node dependabot-merge.cjs --check|--merge PR_NUMBER HEAD_SHA",
  );
  const { baseSha, updates } = inspect(prNumber, sha);
  console.log(updates.join("\n"));
  if (mode === "--check") return;
  assert(
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() ===
      sha,
    "The working tree must be checked out at the exact PR head.",
  );
  const assertClean = () =>
    assert(
      execFileSync("git", ["status", "--porcelain"], {
        encoding: "utf8",
      }).trim() === "",
      "The working tree must be clean.",
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
  assertClean();
  inspect(prNumber, sha, baseSha);
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

module.exports = { assertLowRiskUpdate, assertPullRequest };

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
