import { Cdk8sTeamTypeScriptProject } from '@cdk8s/projen-common';

const project = new Cdk8sTeamTypeScriptProject({
  name: 'cdk8s-dependabot-security-alerts',
  description: 'CDK8s Github Action for creating issues for dependabot security alerts',
  defaultReleaseBranch: 'main',
  minNodeVersion: '14.18.0',
  projenrcTs: true,
  release: false,
  devDeps: ['@cdk8s/projen-common'],
  deps: ['@octokit/rest'],
  bundledDeps: ['@octokit/rest'],
});

project.synth();

