const fs = require("node:fs");

const OUTPUT_DELIMITER = "SECRET_IDS_EOF";

/**
 * Parses comma- or whitespace-separated secret names.
 *
 * @param names - Raw action input.
 * @returns The non-empty secret names in input order.
 */
function parseNames(names = "") {
  return names
    .split(/[,\s]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

/**
 * Formats aliases and secret paths for the Secrets Manager action.
 *
 * @param sharedNames - Names resolved below the shared prefix.
 * @param repoNames - Names resolved below the calling repository prefix.
 * @param callerRepo - Calling repository in owner/name form.
 * @returns Alias and secret ID pairs.
 * @see {@link https://github.com/aws-actions/aws-secretsmanager-get-secrets}
 */
function buildSecretIds(sharedNames, repoNames, callerRepo) {
  const formatIds = (names, prefix) =>
    parseNames(names).map((name) => `${name},${prefix}/${name}`);

  return [
    ...formatIds(sharedNames, "shared"),
    ...formatIds(repoNames, callerRepo),
  ];
}

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
 * @see {@link https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-output-parameter}
 */
function main(environment = process.env) {
  const secretIds = buildSecretIds(
    environment.SHARED_NAMES,
    environment.REPO_NAMES,
    environment.CALLER_REPO,
  );

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
  buildSecretIds,
  main,
  parseNames,
  registerMask,
};
