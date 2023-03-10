import { GitHubActionTypeScriptProject } from 'projen-github-action-typescript';

const project = new GitHubActionTypeScriptProject({
  name: 'cdk8s-dependabot-security-alerts',
  authorName: 'Amazon Web Services',
  authorUrl: 'https://aws.amazon.com',
  repository: 'https://github.com/cdk8s-team/cdk8s-dependabot-security-alerts',
  description: 'CDK8s Github Action for creating issues for dependabot security alerts',
  defaultReleaseBranch: 'main',
  devDeps: ['projen-github-action-typescript'],
  deps: ['@octokit/rest'],
  bundledDeps: ['@octokit/rest'],
  projenrcTs: true,
  release: false,
  autoApproveUpgrades: true,
  autoApproveOptions: {
    allowedUsernames: ['cdk8s-automation'],
    secret: 'GITHUB_TOKEN',
  },
});

project.synth();