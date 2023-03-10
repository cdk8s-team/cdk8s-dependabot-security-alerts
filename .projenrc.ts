// import { GitHubActionTypeScriptProject } from 'projen-github-action-typescript';
import { Cdk8sTeamTypeScriptProject } from '@cdk8s/projen-common';

// const project = new GitHubActionTypeScriptProject({
//   name: 'cdk8s-dependabot-security-alerts',
//   authorName: 'Amazon Web Services',
//   authorUrl: 'https://aws.amazon.com',
//   repository: 'https://github.com/cdk8s-team/cdk8s-dependabot-security-alerts',
//   description: 'CDK8s Github Action for creating issues for dependabot security alerts',
//   defaultReleaseBranch: 'main',
//   devDeps: ['projen-github-action-typescript'],
//   deps: ['@octokit/rest'],
//   bundledDeps: ['@octokit/rest'],
//   projenrcTs: true,
//   release: false,
//   autoApproveUpgrades: true,
//   autoApproveOptions: {
//     allowedUsernames: ['cdk8s-automation'],
//     secret: 'GITHUB_TOKEN',
//   },
// });

const pr = new Cdk8sTeamTypeScriptProject({
  name: 'cdk8s-dependabot-security-alerts',
  description: 'CDK8s Github Action for creating issues for dependabot security alerts',
  defaultReleaseBranch: 'main',
  projenrcTs: true,
  release: false,
  devDeps: ['@cdk8s/projen-common'],
  deps: ['@octokit/rest'],
  bundledDeps: ['@octokit/rest'],
});

pr.synth();

