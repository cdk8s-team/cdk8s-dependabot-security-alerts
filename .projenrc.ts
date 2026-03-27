import { Cdk8sTeamTypeScriptProject } from '@cdk8s/projen-common';
import { DependencyType } from 'projen';

const project = new Cdk8sTeamTypeScriptProject({
  name: 'cdk8s-dependabot-security-alerts',
  description: 'CDK8s Github Action for creating issues for dependabot security alerts',
  defaultReleaseBranch: 'main',
  minNodeVersion: '14.18.0',
  projenrcTs: true,
  release: false,
  devDeps: [
    '@cdk8s/projen-common',
    '@vercel/ncc',
  ],
  deps: ['@octokit/rest'],
  bundledDeps: ['@octokit/rest'],
});

// Override the @types/node pin from @cdk8s/projen-common.
// The old 16.x types are incompatible with TypeScript 5.9's updated Uint8Array generics.
project.deps.removeDependency('@types/node');
project.deps.addDependency('@types/node@^18', DependencyType.BUILD);

project.packageTask.reset('ncc build --source-map --license licenses.txt');
project.package.addField('main', 'lib/index.js');
project.addGitIgnore('!/dist/');
project.annotateGenerated('/dist/**');

project.synth();

