# CDK8s Dependabot Security Alerts

This is a Github Action utilized in CDK8s repositories to create Github Issues for any Dependabot security findings for the repository it's being used in. 

A sample Github Workflow with this Github Action would look like,

```yaml
name: dependabot-security-alerts
on:
  schedule:
    - cron: 27 * * * *
  workflow_dispatch: {}
jobs:
  dependabot_security_alert:
    name: dependabot-security-alert
    runs-on: ubuntu-latest
    permissions:
      security-events: read
      issues: write
    steps:
      - name: Run Script
        uses: cdk8s-team/cdk8s-dependabot-security-alerts@main
        env:
          GITHUB_TOKEN: ${{ secrets.PROJEN_GITHUB_TOKEN }}
          REPO_ROOT: ${{ github.workspace }}
          REPO_NAME: ${{ github.repository }}
          OWNER_NAME: ${{ github.repository_owner }}
```

where, `cdk8s-team/cdk8s-dependabot-security-alerts@main` is our Github Action. 