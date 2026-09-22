const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  buildSecretIds,
  main,
  maskCommand,
} = require("./build-secret-ids");

test("builds shared and repo-specific secret IDs", () => {
  assert.deepEqual(
    buildSecretIds(
      "SHARED_ONE\r\nSHARED_TWO",
      "REPO_ONE, REPO_TWO",
      "aws/example",
    ),
    [
      "SHARED_ONE,shared/SHARED_ONE",
      "SHARED_TWO,shared/SHARED_TWO",
      "REPO_ONE,aws/example/REPO_ONE",
      "REPO_TWO,aws/example/REPO_TWO",
    ],
  );
});

test("writes the secret IDs to the GitHub output file", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "fetch-secrets-"));
  const outputPath = path.join(tempDirectory, "github-output");

  try {
    main({
      CALLER_REPO: "aws/example",
      GITHUB_OUTPUT: outputPath,
      REPO_NAMES: "REPO_ONE",
      SHARED_NAMES: "SHARED_ONE",
    });

    assert.equal(
      fs.readFileSync(outputPath, "utf8"),
      [
        "ids<<SECRET_IDS_EOF",
        "SHARED_ONE,shared/SHARED_ONE",
        "REPO_ONE,aws/example/REPO_ONE",
        "SECRET_IDS_EOF",
        "",
      ].join("\n"),
    );
  } finally {
    fs.rmSync(tempDirectory, { recursive: true });
  }
});

test("sets a failing exit code when both inputs are empty", () => {
  const previousExitCode = process.exitCode;
  process.exitCode = undefined;

  try {
    main({
      CALLER_REPO: "aws/example",
      REPO_NAMES: "",
      SHARED_NAMES: "",
    });
    assert.equal(process.exitCode, 1);
  } finally {
    process.exitCode = previousExitCode;
  }
});

test("formats the role ARN masking command", () => {
  assert.equal(
    maskCommand("arn:aws:iam::123456789012:role/example"),
    "::add-mask::arn:aws:iam::123456789012:role/example",
  );
});

test("uses Node for every run step in the composite action", () => {
  const action = fs.readFileSync(path.join(__dirname, "action.yml"), "utf8");

  assert.doesNotMatch(action, /shell:\s+bash/);
  assert.equal(action.match(/shell:\s+node \{0\}/g)?.length, 2);
});
