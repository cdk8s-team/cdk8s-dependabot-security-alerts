import { GitHubActionTypeScriptProject } from "projen-github-action-typescript";
const project = new GitHubActionTypeScriptProject({
  defaultReleaseBranch: "main",
  devDeps: ["projen-github-action-typescript"],
  name: "cdk8s-dependabot-security-alerts",
  projenrcTs: true,
  release: false,

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();