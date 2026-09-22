const fs = require("node:fs");

const OUTPUT_DELIMITER = "SECRET_IDS_EOF";

/**
 * Registers a value for redaction from subsequent GitHub Actions logs.
 *
 * @param value - Sensitive value to mask.
 * @see {@link https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#masking-a-value-in-a-log}
 */
function registerMask(value) {
  console.log(`::add-mask::${value}`);
}

/**
 * Resolves action inputs and appends the multiline secret ID step output.
 *
 * @param environment - GitHub Actions environment variables.
 * @see {@link https://github.com/aws-actions/aws-secretsmanager-get-secrets}
 * @see {@link https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-output-parameter}
 */
function main(environment = process.env) {
  // Format each name as "<alias>,<prefix>/<name>".
  const formatIds = (names = "", prefix) =>
    names
      .split(/[,\s]+/)
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => `${name},${prefix}/${name}`);

  const secretIds = [
    ...formatIds(environment.SHARED_NAMES, "shared"),
    ...formatIds(environment.REPO_NAMES, environment.CALLER_REPO),
  ];

  if (secretIds.length === 0) {
    console.error(
      "::error::fetch-secrets: neither 'shared' nor 'repo' provided any secret names.",
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Resolved secret-ids:\n${secretIds.map((id) => `  ${id}`).join("\n")}`);

  fs.appendFileSync(
    environment.GITHUB_OUTPUT,
    `ids<<${OUTPUT_DELIMITER}\n${secretIds.join("\n")}\n${OUTPUT_DELIMITER}\n`,
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
  registerMask,
};
