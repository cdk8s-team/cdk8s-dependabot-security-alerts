import { GitHubActionTypeScriptProject } from 'projen-github-action-typescript';

const project = new GitHubActionTypeScriptProject({
  name: 'cdk8s-dependabot-security-alerts',
  description: 'CDK8s Github Action for creating issues for dependabot security alerts',
  defaultReleaseBranch: 'main',
  devDeps: ['projen-github-action-typescript'],
  deps: ['@octokit/rest'],
  bundledDeps: ['@octokit/rest'],
  projenrcTs: true,
  release: false,
});

project.synth();