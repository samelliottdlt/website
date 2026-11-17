import { describe, expect, it } from "@jest/globals";
import {
  assertLowRiskUpdate,
  assertPullRequest,
} from "../.github/scripts/dependabot-merge.cjs";

function fixture() {
  const manifest = {
    scripts: { build: "next build" },
    dependencies: { next: "^16.3.0" },
    devDependencies: { prettier: "^3.9.5" },
  };
  const lock = {
    lockfileVersion: 3,
    packages: {
      "": {
        dependencies: { ...manifest.dependencies },
        devDependencies: { ...manifest.devDependencies },
      },
      "node_modules/next": {
        version: "16.3.0",
        resolved: "https://registry.npmjs.org/next/-/next-16.3.0.tgz",
        integrity: "sha512-YmFzZQ==",
      },
      "node_modules/prettier": {
        version: "3.9.5",
        resolved: "https://registry.npmjs.org/prettier/-/prettier-3.9.5.tgz",
        integrity: "sha512-YmFzZQ==",
      },
    },
  };
  const headManifest: typeof manifest = JSON.parse(JSON.stringify(manifest));
  const headLock: typeof lock = JSON.parse(JSON.stringify(lock));
  headManifest.dependencies.next = "^16.3.1";
  headLock.packages[""].dependencies.next = "^16.3.1";
  headLock.packages["node_modules/next"] = {
    version: "16.3.1",
    resolved: "https://registry.npmjs.org/next/-/next-16.3.1.tgz",
    integrity: "sha512-aGVhZA==",
  };
  return { manifest, headManifest, lock, headLock };
}

describe("Dependabot low-risk merge policy", () => {
  it("accepts grouped stable updates using lockfile versions instead of PR titles", () => {
    const { manifest, headManifest, lock, headLock } = fixture();
    headManifest.devDependencies.prettier = "^3.10.0";
    headLock.packages[""].devDependencies.prettier = "^3.10.0";
    headLock.packages["node_modules/prettier"].version = "3.10.0";
    expect(
      assertLowRiskUpdate(manifest, headManifest, lock, headLock),
    ).toHaveLength(2);
  });

  it("accepts a lockfile-only transitive patch update", () => {
    const { manifest, lock, headLock } = fixture();
    headLock.packages[""] = JSON.parse(JSON.stringify(lock.packages[""]));
    expect(
      assertLowRiskUpdate(manifest, manifest, lock, headLock),
    ).toHaveLength(1);
  });

  it("allows compatible transitive range advances without changing the graph", () => {
    const { manifest, headManifest, lock, headLock } = fixture();
    Object.assign(lock.packages["node_modules/next"], {
      dependencies: { "@next/env": "16.3.0" },
    });
    Object.assign(headLock.packages["node_modules/next"], {
      dependencies: { "@next/env": "16.3.1" },
    });
    expect(
      assertLowRiskUpdate(manifest, headManifest, lock, headLock),
    ).toHaveLength(1);
    Object.assign(headLock.packages["node_modules/next"], {
      dependencies: { "@next/env": "17.0.0" },
    });
    expect(() =>
      assertLowRiskUpdate(manifest, headManifest, lock, headLock),
    ).toThrow(/Major/);
  });

  it.each(["^17.0.0", "^16.4.0-rc.1", "~16.3.1", "^16.2.9"])(
    "rejects a major, prerelease, range change, or downgrade: %s",
    (version) => {
      const { manifest, headManifest, lock, headLock } = fixture();
      headManifest.dependencies.next = version;
      expect(() =>
        assertLowRiskUpdate(manifest, headManifest, lock, headLock),
      ).toThrow();
    },
  );

  it("rejects a transitive major even when the direct dependency is only a patch", () => {
    const { manifest, headManifest, lock, headLock } = fixture();
    headLock.packages["node_modules/prettier"].version = "4.0.0";
    expect(() =>
      assertLowRiskUpdate(manifest, headManifest, lock, headLock),
    ).toThrow(/Major/);
  });

  it("treats a 0.x minor as potentially breaking but permits a 0.x patch", () => {
    const { manifest, lock, headLock } = fixture();
    lock.packages["node_modules/prettier"].version = "0.2.1";
    headLock.packages[""] = JSON.parse(JSON.stringify(lock.packages[""]));
    headLock.packages["node_modules/prettier"].version = "0.3.0";
    expect(() =>
      assertLowRiskUpdate(manifest, manifest, lock, headLock),
    ).toThrow(/0.x/);
    headLock.packages["node_modules/prettier"].version = "0.2.2";
    expect(
      assertLowRiskUpdate(manifest, manifest, lock, headLock),
    ).toHaveLength(2);
  });

  it("rejects changes to npm scripts", () => {
    const { manifest, headManifest, lock, headLock } = fixture();
    headManifest.scripts.build = "echo skipped";
    expect(() =>
      assertLowRiskUpdate(manifest, headManifest, lock, headLock),
    ).toThrow(/Non-dependency/);
  });

  it("rejects inconsistent manifest and lockfile ranges", () => {
    const { manifest, headManifest, lock, headLock } = fixture();
    headLock.packages[""].dependencies.next = "^16.2.0";
    expect(() =>
      assertLowRiskUpdate(manifest, headManifest, lock, headLock),
    ).toThrow(/disagree/);
  });

  it("rejects removed locked packages", () => {
    const { manifest, headManifest, lock, headLock } = fixture();
    Reflect.deleteProperty(headLock.packages, "node_modules/prettier");
    expect(() =>
      assertLowRiskUpdate(manifest, headManifest, lock, headLock),
    ).toThrow(/Adding or removing locked/);
  });

  it("rejects an integrity-only rewrite at the same version", () => {
    const { manifest, headManifest, lock, headLock } = fixture();
    headLock.packages["node_modules/prettier"].integrity = "sha512-aGVhZA==";
    expect(() =>
      assertLowRiskUpdate(manifest, headManifest, lock, headLock),
    ).toThrow(/non-forward/);
  });

  it("rejects packages fetched outside the npm registry", () => {
    const { manifest, headManifest, lock, headLock } = fixture();
    headLock.packages["node_modules/next"].resolved =
      "https://example.com/next.tgz";
    expect(() =>
      assertLowRiskUpdate(manifest, headManifest, lock, headLock),
    ).toThrow(/npm registry/);
  });

  it("rejects updates of packages with install scripts", () => {
    const { manifest, headManifest, lock, headLock } = fixture();
    Object.assign(lock.packages["node_modules/next"], {
      hasInstallScript: true,
    });
    Object.assign(headLock.packages["node_modules/next"], {
      hasInstallScript: true,
    });
    expect(() =>
      assertLowRiskUpdate(manifest, headManifest, lock, headLock),
    ).toThrow(/install scripts/);
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
