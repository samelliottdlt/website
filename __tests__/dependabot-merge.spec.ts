import { describe, expect, it } from "@jest/globals";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertCleanStatus,
  assertPullRequest,
  assessDependencyUpdate,
  assessPullRequestChanges,
  smokeRoutes,
} from "../.github/scripts/dependabot-merge.cjs";

describe("Dependency validation working tree", () => {
  it("allows Next.js to regenerate its declaration file only after validation", () => {
    expect(() => assertCleanStatus(" M next-env.d.ts\n")).toThrow(/clean/);
    expect(assertCleanStatus(" M next-env.d.ts\n", true)).toBe(true);
    expect(assertCleanStatus("", true)).toBe(false);
  });

  it("never permits a changed source file or untracked file after validation", () => {
    expect(() =>
      assertCleanStatus(" M next-env.d.ts\n M app/page.tsx\n", true),
    ).toThrow(/clean/);
    expect(() => assertCleanStatus("?? unexpected.js\n", true)).toThrow(
      /clean/,
    );
  });
});

type LockRecord = {
  version?: string;
  devDependencies?: Record<string, string>;
  resolved?: string;
  integrity?: string;
  license?: string;
  inBundle?: boolean;
  hasInstallScript?: boolean;
  dependencies?: Record<string, string>;
};

function record(name: string, version: string, extra = {}): LockRecord {
  return {
    version,
    resolved: `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`,
    integrity: `sha512-${Buffer.from(`${name}@${version}`).toString("base64")}`,
    license: "MIT",
    ...extra,
  };
}

function fixture() {
  const manifest = {
    scripts: { build: "next build" },
    dependencies: { next: "^16.3.0" } as Record<string, string>,
    devDependencies: {
      "@types/node": "^24.19.2",
      prettier: "^3.9.5",
    } as Record<string, string>,
  };
  const lock = {
    lockfileVersion: 3,
    packages: {
      "": {
        dependencies: { ...manifest.dependencies },
        devDependencies: { ...manifest.devDependencies },
      },
      "node_modules/next": record("next", "16.3.0", {
        dependencies: { "@next/env": "16.3.0" },
      }),
      "node_modules/@next/env": record("@next/env", "16.3.0"),
      "node_modules/@types/node": record("@types/node", "24.19.2", {
        dependencies: { "undici-types": ">=7.24.0 <7.24.7" },
      }),
      "node_modules/undici-types": record("undici-types", "7.24.6"),
      "node_modules/prettier": record("prettier", "3.9.5"),
    } as Record<string, LockRecord>,
  };
  const headManifest: typeof manifest = JSON.parse(JSON.stringify(manifest));
  const headLock: typeof lock = JSON.parse(JSON.stringify(lock));
  return { manifest, headManifest, lock, headLock };
}

type Fixture = ReturnType<typeof fixture>;

function setRange(
  { headManifest, headLock }: Fixture,
  section: "dependencies" | "devDependencies",
  name: string,
  range: string,
) {
  headManifest[section][name] = range;
  const root = headLock.packages[""];
  root[section] = { ...root[section], [name]: range };
}

function setPackage(
  { headLock }: Fixture,
  path: string,
  version: string,
  extra = {},
) {
  const name = path.slice(path.lastIndexOf("node_modules/") + 13);
  headLock.packages[path] = record(name, version, extra);
}

function assess(f: Fixture) {
  return assessDependencyUpdate(f.manifest, f.headManifest, f.lock, f.headLock);
}

describe("Dependabot merge tiers", () => {
  it("accepts grouped compatible updates using lockfile versions instead of PR titles", () => {
    const f = fixture();
    setRange(f, "dependencies", "next", "^16.3.1");
    setPackage(f, "node_modules/next", "16.3.1", {
      dependencies: { "@next/env": "16.3.1" },
    });
    setPackage(f, "node_modules/@next/env", "16.3.1");
    setRange(f, "devDependencies", "prettier", "^3.10.0");
    setPackage(f, "node_modules/prettier", "3.10.0");
    expect(assess(f)).toEqual({
      updates: [
        "node_modules/@next/env: 16.3.0 -> 16.3.1",
        "node_modules/next: 16.3.0 -> 16.3.1",
        "node_modules/prettier: 3.9.5 -> 3.10.0",
      ],
      runtime: [],
    });
  });

  it("merges tooling majors, including type-only transitive majors, automatically", () => {
    const f = fixture();
    setRange(f, "devDependencies", "@types/node", "^26.6.6");
    setPackage(f, "node_modules/@types/node", "26.6.6", {
      dependencies: { "undici-types": "~8.9.0" },
    });
    setPackage(f, "node_modules/undici-types", "8.9.0");
    setRange(f, "devDependencies", "prettier", "^4.0.0");
    setPackage(f, "node_modules/prettier", "4.0.0");
    expect(assess(f).runtime).toEqual([]);
  });

  it("requires the runtime tier when a shipped package also uses a tooling dependency", () => {
    const f = fixture();
    for (const lock of [f.lock, f.headLock]) {
      Object.assign(lock.packages["node_modules/next"], {
        dependencies: { "@next/env": "16.3.0", "undici-types": "*" },
      });
    }
    setPackage(f, "node_modules/undici-types", "8.0.0");
    expect(assess(f).runtime).toEqual([
      "node_modules/undici-types: major 7.24.6 -> 8.0.0",
    ]);
  });

  it("requires the runtime tier for direct and transitive runtime majors", () => {
    const f = fixture();
    setRange(f, "dependencies", "next", "^17.0.0");
    setPackage(f, "node_modules/next", "17.0.0", {
      dependencies: { "@next/env": "17.0.0" },
    });
    setPackage(f, "node_modules/@next/env", "17.0.0");
    expect(assess(f).runtime).toEqual([
      "next: major range ^16.3.0 -> ^17.0.0",
      "node_modules/@next/env: major 16.3.0 -> 17.0.0",
      "node_modules/next: major 16.3.0 -> 17.0.0",
      "node_modules/next: dependencies changed",
    ]);
  });

  it("treats a runtime 0.x minor as potentially breaking but permits a 0.x patch", () => {
    const f = fixture();
    for (const lock of [f.lock, f.headLock]) {
      lock.packages["node_modules/@next/env"] = record("@next/env", "0.2.1");
    }
    setPackage(f, "node_modules/@next/env", "0.3.0");
    expect(assess(f).runtime).toEqual([
      "node_modules/@next/env: major 0.2.1 -> 0.3.0",
    ]);
    setPackage(f, "node_modules/@next/env", "0.2.2");
    expect(assess(f).runtime).toEqual([]);
  });

  it("classifies added packages by whether shipped code can reach them", () => {
    const f = fixture();
    setPackage(f, "node_modules/@types/node", "24.19.3", {
      dependencies: { "undici-types": "^7.24.0", "new-types": "^1.0.0" },
    });
    setPackage(f, "node_modules/new-types", "1.0.0");
    expect(assess(f).runtime).toEqual([]);
    setPackage(f, "node_modules/next", "16.3.0", {
      dependencies: { "@next/env": "16.3.0", "new-types": "^1.0.0" },
    });
    expect(assess(f).runtime).toEqual([
      "node_modules/new-types: added runtime package",
      "node_modules/next: dependencies changed",
    ]);
  });

  it("accepts bundled packages covered by their parent tarball", () => {
    const f = fixture();
    setPackage(f, "node_modules/prettier", "3.9.6", {
      dependencies: { bundled: "^1.0.0" },
    });
    f.headLock.packages["node_modules/prettier/node_modules/bundled"] = {
      version: "1.0.0",
      license: "MIT",
      inBundle: true,
    };
    expect(assess(f).runtime).toEqual([]);
  });

  it.each([
    ["a prerelease", "^16.4.0-rc.1", "16.4.0-rc.1", /stable semver/],
    ["a range operator change", "~16.3.1", "16.3.1", /operators/],
    ["a downgrade", "^16.2.9", "16.2.9", /Downgrades/],
  ])("always refuses %s", (_label, range, version, error) => {
    const f = fixture();
    setRange(f, "dependencies", "next", range);
    setPackage(f, "node_modules/next", version);
    expect(() => assess(f)).toThrow(error);
  });

  it("rejects changes to npm scripts", () => {
    const f = fixture();
    f.headManifest.scripts.build = "echo skipped";
    expect(() => assess(f)).toThrow(/Non-dependency/);
  });

  it("rejects adding direct dependencies", () => {
    const f = fixture();
    setRange(f, "devDependencies", "eslint", "^10.0.0");
    setPackage(f, "node_modules/eslint", "10.0.0");
    expect(() => assess(f)).toThrow(/direct dependencies/);
  });

  it("rejects inconsistent manifest and lockfile ranges", () => {
    const f = fixture();
    f.headLock.packages[""].dependencies = { next: "^16.2.0" };
    expect(() => assess(f)).toThrow(/disagree/);
  });

  it("rejects a lockfile missing a direct dependency", () => {
    const f = fixture();
    Reflect.deleteProperty(f.headLock.packages, "node_modules/prettier");
    expect(() => assess(f)).toThrow(/missing direct dependency prettier/);
  });

  it("rejects a tarball rewrite at the same version", () => {
    const f = fixture();
    setPackage(f, "node_modules/prettier", "3.9.5", {
      integrity: "sha512-aGVhZA==",
    });
    expect(() => assess(f)).toThrow(/tarball changed/);
  });

  it("rejects packages fetched outside the npm registry", () => {
    const f = fixture();
    setPackage(f, "node_modules/prettier", "4.0.0", {
      resolved: "https://example.com/prettier.tgz",
    });
    expect(() => assess(f)).toThrow(/npm registry/);
  });

  it("rejects updates of packages with install scripts", () => {
    const f = fixture();
    setPackage(f, "node_modules/prettier", "3.9.6", {
      hasInstallScript: true,
    });
    expect(() => assess(f)).toThrow(/install scripts/);
  });
});

describe("Dependabot PR changes", () => {
  const packageFiles = [
    {
      filename: "package.json",
      status: "modified",
      additions: 1,
      deletions: 1,
    },
    {
      filename: "package-lock.json",
      status: "modified",
      additions: 8,
      deletions: 8,
    },
  ];
  const dependabot = {
    author: { login: "dependabot[bot]" },
    commit: { message: "build(deps): bump next" },
  };
  const repair = {
    author: { login: "samelliottdlt" },
    commit: { message: "fix(deps): adapt to next 17" },
  };
  const source = (filename: string, status = "modified", lines = 10) => ({
    filename,
    status,
    additions: lines,
    deletions: 0,
  });

  it("accepts Dependabot package changes without a runtime reason", () => {
    expect(assessPullRequestChanges(packageFiles, [dependabot])).toEqual([]);
  });

  it("puts bounded fix(deps) source repairs in the runtime tier", () => {
    expect(
      assessPullRequestChanges(
        [
          ...packageFiles,
          source("app/page.tsx"),
          source("lib/new.ts", "added"),
        ],
        [dependabot, repair],
      ),
    ).toEqual(["1 fix(deps): repair commits changing 20 source lines"]);
  });

  it.each([
    source("__tests__/utf8.spec.ts"),
    source(".github/workflows/node.js.yml"),
    source("next.config.ts"),
    source("app/blog/AGENTS.md"),
    source("app/page.tsx", "removed"),
    source("app/page.tsx", "modified", 301),
  ])("refuses unsafe repair file $filename ($status)", (file) => {
    expect(() =>
      assessPullRequestChanges([...packageFiles, file], [dependabot, repair]),
    ).toThrow();
  });

  it("refuses commits that are neither Dependabot nor fix(deps) repairs", () => {
    expect(() =>
      assessPullRequestChanges(packageFiles, [
        dependabot,
        { author: { login: "someone" }, commit: { message: "tweak" } },
      ]),
    ).toThrow(/fix\(deps\)/);
  });

  it("escalates after three repair commits", () => {
    expect(() =>
      assessPullRequestChanges(packageFiles, [
        dependabot,
        repair,
        repair,
        repair,
        repair,
      ]),
    ).toThrow(/More than 3/);
  });
});

describe("Production smoke routes", () => {
  it("includes static and prerendered routes but not dynamic or internal ones", () => {
    const dir = mkdtempSync(join(tmpdir(), "smoke-"));
    writeFileSync(
      join(dir, "app-path-routes-manifest.json"),
      JSON.stringify({
        "/page": "/",
        "/blog/[slug]/page": "/blog/[slug]",
        "/_not-found/page": "/_not-found",
        "/about-me/page": "/about-me",
      }),
    );
    writeFileSync(
      join(dir, "prerender-manifest.json"),
      JSON.stringify({ routes: { "/blog/test": {}, "/": {} } }),
    );
    expect(smokeRoutes(dir)).toEqual(["/", "/about-me", "/blog/test"]);
  });
});

describe("Dependabot merge target", () => {
  function pullRequest() {
    return {
      state: "open",
      draft: false,
      user: { login: "dependabot[bot]" },
      head: {
        repo: { full_name: "samelliottdlt/website" },
        ref: "dependabot/npm_and_yarn/group",
        sha: "reviewed-head",
      },
      base: {
        repo: { full_name: "samelliottdlt/website" },
        ref: "main",
        sha: "reviewed-base",
      },
      mergeable: true,
      mergeable_state: "clean",
      requested_reviewers: [],
      requested_teams: [],
    };
  }

  it("accepts only the reviewed head and base", () => {
    expect(() =>
      assertPullRequest(pullRequest(), "reviewed-head", "reviewed-base"),
    ).not.toThrow();
    expect(() =>
      assertPullRequest(pullRequest(), "different-head", "reviewed-base"),
    ).toThrow(/head changed/);
    expect(() =>
      assertPullRequest(pullRequest(), "reviewed-head", "different-base"),
    ).toThrow(/Main changed/);
  });

  it("rejects a fork even when it uses a Dependabot-looking branch", () => {
    const pull = pullRequest();
    pull.head.repo.full_name = "someone/website";
    expect(() =>
      assertPullRequest(pull, "reviewed-head", "reviewed-base"),
    ).toThrow(/same-repository/);
  });

  it("rejects blocked branch protections", () => {
    const pull = pullRequest();
    pull.mergeable_state = "blocked";
    expect(() =>
      assertPullRequest(pull, "reviewed-head", "reviewed-base"),
    ).toThrow(/branch protections/);
  });

  it("respects an explicit request for human review", () => {
    const pull = pullRequest();
    Object.assign(pull, { requested_reviewers: [{ login: "samelliottdlt" }] });
    expect(() =>
      assertPullRequest(pull, "reviewed-head", "reviewed-base"),
    ).toThrow(/human review/);
  });
});
