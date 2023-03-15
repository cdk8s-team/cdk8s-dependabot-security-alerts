const issueNumber = 4;
const issueTitle = '[HIGH] Some Security Issue';
const issueURL = 'some-url';
const issueBody = `Github reported a new dependabot security incident at: ${issueURL}`;
const ownerName = 'cdk8s-mock-owner';
const repoName = 'cdk8s-mock-repo';
const rawRepoName = `${ownerName}/${repoName}`;
const token = 'cdk8s-mock-token';
const P0_ISSUE_LABEL = 'priority/p0';
const TRIAGE_LABEL = 'needs-triage';
const DEPENDABOT_SECURITY_INCIDENT_LABEL = 'dependabot-security-finding';

const oldEnv = process.env;
process.env = {
  ...oldEnv,
  OWNER_NAME: ownerName,
  REPO_NAME: rawRepoName,
  GITHUB_TOKEN: token,
};

const mockListIssues = jest.fn().mockResolvedValue({
  data: [{
    labels: [DEPENDABOT_SECURITY_INCIDENT_LABEL],
    state: 'open',
  }],
});

const mockCreateIssue = jest.fn();

const mockListDependabotAlerts = jest.fn().mockResolvedValue({
  data: [{
    number: issueNumber,
    html_url: issueURL,
    state: 'open',
    security_advisory: {
      severity: 'high',
      summary: 'Some Security Issue',
    },
    created_at: subtractDays(5).toISOString(),
  }],
});

import { createOctokitClient, getRepositoryName, getRepositoryOwner, isTwoDaysOld, run } from '../src/create-dependabot-issue';

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    issues: {
      listForRepo: mockListIssues,
      create: mockCreateIssue,
    },
    dependabot: {
      listAlertsForRepo: mockListDependabotAlerts,
    },
  })),
}));

describe('security workflow script', () => {
  test('creates issue', async () => {
    await run();

    expect(mockListIssues).toHaveBeenCalled();
    expect(mockListIssues).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
    });

    expect(mockListDependabotAlerts).toHaveBeenCalled();
    expect(mockListDependabotAlerts).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
    });

    expect(mockCreateIssue).toHaveBeenCalled();
    expect(mockCreateIssue).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
      title: issueTitle,
      body: issueBody,
      labels: [
        DEPENDABOT_SECURITY_INCIDENT_LABEL,
        P0_ISSUE_LABEL,
        TRIAGE_LABEL,
      ],
    });
  });

  test('does not create issue when there are no alerts', async () => {
    mockListDependabotAlerts.mockResolvedValueOnce({
      data: [],
    });

    await run();

    expect(mockListIssues).toHaveBeenCalled();
    expect(mockListIssues).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
    });

    expect(mockListDependabotAlerts).toHaveBeenCalled();
    expect(mockListDependabotAlerts).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
    });

    expect(mockCreateIssue).not.toHaveBeenCalled();
  });

  test('does not create issue when issue already exists', async () => {
    mockListIssues.mockResolvedValueOnce({
      data: [{
        labels: [DEPENDABOT_SECURITY_INCIDENT_LABEL],
        title: issueTitle,
        state: 'open',
      }],
    });

    await run();

    expect(mockListIssues).toHaveBeenCalled();
    expect(mockListIssues).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
    });

    expect(mockListDependabotAlerts).toHaveBeenCalled();
    expect(mockListDependabotAlerts).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
    });

    expect(mockCreateIssue).not.toHaveBeenCalled();
  });

  test('does not create issue for any other status than open for security incident', async () => {
    mockListDependabotAlerts.mockResolvedValue({
      data: [
        {
          number: 5,
          html_url: 'someUrl',
          state: 'dismissed',
          security_advisory: {
            severity: 'high',
            summary: 'Some Security Issue',
          },
          created_at: subtractDays(5).toISOString(),
        },
        {
          number: 6,
          html_url: 'anotherUrl',
          state: 'fixed',
          security_advisory: {
            severity: 'high',
            summary: 'Another Security Issue',
          },
          created_at: subtractDays(5).toISOString(),
        },
      ],
    });

    await run();

    expect(mockListIssues).toHaveBeenCalled();
    expect(mockListIssues).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
    });

    expect(mockListDependabotAlerts).toHaveBeenCalled();
    expect(mockListDependabotAlerts).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
    });

    expect(mockCreateIssue).not.toHaveBeenCalled();
  });

  test('disregards pull requests when creating issue', async () => {
    mockListIssues.mockResolvedValueOnce({
      data: [{
        labels: [DEPENDABOT_SECURITY_INCIDENT_LABEL],
        title: issueTitle,
        state: 'open',
        pull_request: 'some_pr',
      }],
    });

    await run();

    expect(mockListIssues).toHaveBeenCalled();
    expect(mockListIssues).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
    });

    expect(mockListDependabotAlerts).toHaveBeenCalled();
    expect(mockListDependabotAlerts).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
    });

    expect(mockCreateIssue).not.toHaveBeenCalled();
  });

  test('does not get incidents newer than two days', async () => {
    mockListDependabotAlerts.mockResolvedValueOnce({
      data: [
        {
          number: issueNumber,
          html_url: issueURL,
          state: 'open',
          security_advisory: {
            severity: 'high',
            summary: 'Some Security Issue',
          },
          created_at: subtractDays(5).toISOString(),
        },
        {
          number: 6,
          html_url: 'anotherUrl',
          state: 'open',
          security_advisory: {
            severity: 'high',
            summary: 'Another Security Issue',
          },
          created_at: subtractDays(1).toISOString(),
        },
        {
          number: 7,
          html_url: 'randomUrl',
          state: 'open',
          security_advisory: {
            severity: 'high',
            summary: 'Random Security Issue',
          },
          created_at: subtractDays(0).toISOString(),
        },
      ],
    });

    await run();

    expect(mockListIssues).toHaveBeenCalled();
    expect(mockListIssues).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
    });

    expect(mockListDependabotAlerts).toHaveBeenCalled();
    expect(mockListDependabotAlerts).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
    });

    expect(mockCreateIssue).toHaveBeenCalledTimes(1);
    expect(mockCreateIssue).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
      title: issueTitle,
      body: issueBody,
      labels: [
        DEPENDABOT_SECURITY_INCIDENT_LABEL,
        P0_ISSUE_LABEL,
        TRIAGE_LABEL,
      ],
    });
  });

  test('throws if GITHUB_TOKEN is not present', () => {
    delete process.env.GITHUB_TOKEN;

    expect(() => createOctokitClient()).toThrow('GITHUB_TOKEN must be set');
  });

  test('throws if OWNER_NAME is not present', () => {
    delete process.env.OWNER_NAME;

    expect(() => getRepositoryOwner()).toThrow('OWNER_NAME must be set');
  });

  test('throws if REPO_NAME is not present', () => {
    delete process.env.REPO_NAME;

    expect(() => getRepositoryName()).toThrow('REPO_NAME must be set');
  });

  test('isTwoDaysOld is true for date older than two days', () => {
    const creationDate = subtractDays(4).toISOString();
    const result = isTwoDaysOld(creationDate);

    expect(result).toBeTruthy();
  });

  test('isTwoDaysOld is true for date equal to two days', () => {
    const creationDate = subtractDays(2).toISOString();
    const result = isTwoDaysOld(creationDate);

    expect(result).toBeTruthy();
  });

  test('isTwoDaysOld is false for date newer than two days', () => {
    const creationDate = subtractDays(1).toISOString();
    const result = isTwoDaysOld(creationDate);

    expect(result).toBeFalsy();
  });

  afterEach(() => {
    jest.resetModules();
    process.env = {
      ...oldEnv,
      OWNER_NAME: ownerName,
      REPO_NAME: repoName,
      GITHUB_TOKEN: token,
    };
  });
});


/**
 * Add number of days to current date
 * @param numberOfDays Number of days
 * @returns The new date with added days
 */
function subtractDays(numberOfDays: number, date: Date = new Date()): Date {
  const newDate = new Date(date.setDate(date.getDate() - numberOfDays));

  return newDate;
}