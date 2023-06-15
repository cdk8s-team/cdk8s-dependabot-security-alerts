import { Octokit } from '@octokit/rest';

const DEPENDABOT_SECURITY_ALERT_LABEL = 'dependabot-security-finding';
const P0_ISSUE_LABEL = 'priority/p0';
const TRIAGE_LABEL = 'needs-triage';

const owner = getRepositoryOwner();
const repository = getRepositoryName();
const client = createOctokitClient();

/**
 * Runs as part of Dependabot Security Alerts workflow.
 * This creates an issue for any dependabot security alerts that github creates for the repository.
 */
export async function run() {
  const existingIssues = await client.paginate('GET /repos/{owner}/{repo}/issues', {
    owner: owner,
    repo: repository,
    per_page: 100,
  });

  // This also returns pull requests, so making sure we are only considering issues
  // https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#list-repository-issues
  const existingDependabotSecurityIssues = existingIssues.filter((issue) => {
    // Labels could either be a string or an object
    // https://docs.github.com/en/rest/issues/labels?apiVersion=2022-11-28#list-labels-for-a-repository
    function hasSecurityLabel() {
      return issue.labels.filter((label) => {
        if (typeof label === 'string') {
          return label === DEPENDABOT_SECURITY_ALERT_LABEL;
        } else {
          return label.name === DEPENDABOT_SECURITY_ALERT_LABEL;
        }
      });
    };

    return hasSecurityLabel() && !issue.pull_request && issue.state === 'open';
  },
  );

  const dependabotSecurityAlerts = await client.paginate('GET /repos/{owner}/{repo}/dependabot/alerts', {
    owner: owner,
    repo: repository,
    per_page: 100,
  });

  const openSecurityAlerts = dependabotSecurityAlerts.filter((alert) =>
    alert.state === 'open' &&
    isTwoDaysOld(alert.created_at),
  );

  for (const alert of openSecurityAlerts) {
    const severity = alert.security_advisory.severity.toUpperCase();
    const summary = alert.security_advisory.summary;

    const issueTitle = `[${severity}] ${summary}`;

    const issueExists = existingDependabotSecurityIssues.find((issue) => issue.title === issueTitle);

    if (issueExists === undefined) {
      await createDependabotSecurityIssue(issueTitle, alert.html_url);
    }
  }
}

/**
 * Helper method to create a dependabot security alert issue.
 * @param issueTitle The title of the issue to create.
 * @param alertUrl The URL to the dependabot security alert.
 */
async function createDependabotSecurityIssue(issueTitle: string, alertUrl: string) {
  await client.issues.create({
    owner: owner,
    repo: repository,
    title: issueTitle,
    body: `Github reported a new dependabot security alert at: ${alertUrl}`,
    labels: [
      DEPENDABOT_SECURITY_ALERT_LABEL,
      P0_ISSUE_LABEL,
      TRIAGE_LABEL,
    ],
  });
}

/**
 * Create an octokit client.
 * @returns Octokit
 */
export function createOctokitClient(): Octokit {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GITHUB_TOKEN must be set');
  }

  return new Octokit({ auth: token });
}

/**
 * Retrieves the repository owner from environment
 * @returns Repository owner
 */
export function getRepositoryOwner(): string {
  const ownerName = process.env.OWNER_NAME;

  if (!ownerName) {
    throw new Error('OWNER_NAME must be set');
  }

  return ownerName;
}

/**
 * Retrieves the repository name from environment
 * @returns Repository name
 */
export function getRepositoryName(): string {
  const repositoryName = process.env.REPO_NAME;

  if (!repositoryName) {
    throw new Error('REPO_NAME must be set');
  }

  // Repository name is of format 'owner/repositoryName'
  // https://docs.github.com/en/actions/learn-github-actions/contexts#github-context
  return repositoryName.split('/')[1];
}

/**
 * Checks if a given date is two or more days older than current date
 * @param date Date
 * @returns Result of comparison
 */
export function isTwoDaysOld(date: string): boolean {
  const currentDate = new Date().getTime();
  const creationDate = new Date(date).getTime();

  const dateDiff = Math.abs(currentDate - creationDate);
  const dayDiff = Math.floor(dateDiff/(24 * 60 * 60 * 1000));
  const result = dayDiff >= 2;

  return result;
}

run().catch((err) => {
  throw err;
});