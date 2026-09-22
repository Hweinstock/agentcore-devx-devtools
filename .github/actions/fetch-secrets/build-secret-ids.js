const fs = require("node:fs");

const OUTPUT_DELIMITER = "SECRET_IDS_EOF";

function parseNames(names = "") {
  return names
    .split(/[,\s]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function buildSecretIds(sharedNames, repoNames, callerRepo) {
  const formatIds = (names, prefix) =>
    parseNames(names).map((name) => `${name},${prefix}/${name}`);

  return [
    ...formatIds(sharedNames, "shared"),
    ...formatIds(repoNames, callerRepo),
  ];
}

function registerMask(value) {
  console.log(`::add-mask::${value}`);
}

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
