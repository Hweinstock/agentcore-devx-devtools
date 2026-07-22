# AgentCore DevX DevTools

Shared developer tools for the AgentCore repositories: [agentcore-cli](https://github.com/aws/agentcore-cli), [bedrock-agentcore-sdk-python](https://github.com/aws/bedrock-agentcore-sdk-python), [bedrock-agentcore-sdk-typescript](https://github.com/aws/bedrock-agentcore-sdk-typescript). This repo is the home for all reusable GitHub Actions workflows and composite actions.

## Reusable workflows

The `.github/workflows/` directory contains reusable workflows. Each is invoked via [`workflow_call`](https://docs.github.com/en/actions/using-workflows/reusing-workflows) from a caller workflow in a consuming repo.


## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
