const issueNumber = 4;
const issueTitle = '[HIGH] Some Security Issue';
const issueURL = 'some-url';
const issueBody = `Github reported a new dependabot security alert at: ${issueURL}`;
const ownerName = 'cdk8s-mock-owner';
const repoName = 'cdk8s-mock-repo';
const rawRepoName = `${ownerName}/${repoName}`;
const token = 'cdk8s-mock-token';
const P0_ISSUE_LABEL = 'priority/p0';
const TRIAGE_LABEL = 'needs-triage';
const DEPENDABOT_SECURITY_ALERT_LABEL = 'dependabot-security-finding';
const listIssuesDefaultVal = [{
  labels: [DEPENDABOT_SECURITY_ALERT_LABEL],
  state: 'open',
}];
const listDepAlertDefaultVal = [{
  number: issueNumber,
  html_url: issueURL,
  state: 'open',
  security_advisory: {
    severity: 'high',
    summary: 'Some Security Issue',
  },
  created_at: subtractDays(5).toISOString(),
}];

type listIssuesType = {
  labels: string[];
  state: string;
};

type securityAdvisoryType = {
  severity: string;
  summary: string;
}

type listDependabotAlertsType = {
  number: number;
  html_url: string;
  state: string;
  security_advisory: securityAdvisoryType;
  created_at: string;
};

const oldEnv = process.env;
process.env = {
  ...oldEnv,
  OWNER_NAME: ownerName,
  REPO_NAME: rawRepoName,
  GITHUB_TOKEN: token,
};

const mockListIssues = jest.fn();
const mockCreateIssue = jest.fn();
const mockListDependabotAlerts = jest.fn();
const mockPaginate = jest.fn().mockResolvedValue([]);

import { createOctokitClient, getRepositoryName, getRepositoryOwner, isTwoDaysOld, run } from '../src/create-dependabot-issue';

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    paginate: mockPaginate,
    rest: {
      issues: {
        listForRepo: mockListIssues,
      },
      dependabot: {
        listAlertsForRepo: mockListDependabotAlerts,
      },
    },
    issues: {
      create: mockCreateIssue,
    },
  })),
}));

describe('security workflow script', () => {
  test('creates issue', async () => {
    // GIVEN
    mockPagination();

    // WHEN
    await run();

    // THEN
    expect(mockPaginate).toHaveBeenCalledTimes(2);
    expect(mockPaginate).toHaveBeenNthCalledWith(
      1,
      mockListIssues,
      {
        owner: 'cdk8s-mock-owner',
        repo: 'cdk8s-mock-repo',
        per_page: 100,
      },
    );
    expect(mockPaginate).toHaveBeenNthCalledWith(
      2,
      mockListDependabotAlerts,
      {
        owner: 'cdk8s-mock-owner',
        repo: 'cdk8s-mock-repo',
        per_page: 100,
      },
    );

    expect(mockCreateIssue).toHaveBeenCalled();
    expect(mockCreateIssue).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
      title: issueTitle,
      body: issueBody,
      labels: [
        DEPENDABOT_SECURITY_ALERT_LABEL,
        P0_ISSUE_LABEL,
        TRIAGE_LABEL,
      ],
    });
  });

  test('does not create issue WHEN there are no alerts', async () => {
    // GIVEN
    mockPagination(listIssuesDefaultVal, []);

    // WHEN
    await run();

    // THEN
    expect(mockPaginate).toHaveBeenCalledTimes(2);
    expect(mockPaginate).toHaveBeenNthCalledWith(
      1,
      mockListIssues,
      {
        owner: 'cdk8s-mock-owner',
        repo: 'cdk8s-mock-repo',
        per_page: 100,
      },
    );
    expect(mockPaginate).toHaveBeenNthCalledWith(
      2,
      mockListDependabotAlerts,
      {
        owner: 'cdk8s-mock-owner',
        repo: 'cdk8s-mock-repo',
        per_page: 100,
      },
    );

    expect(mockCreateIssue).not.toHaveBeenCalled();
  });

  test('does not create issue WHEN issue already exists', async () => {
    // GIVEN
    const alreadyExistingIssue = [{
      labels: [DEPENDABOT_SECURITY_ALERT_LABEL],
      title: issueTitle,
      state: 'open',
    }];
    mockPagination(alreadyExistingIssue, listDepAlertDefaultVal);

    // WHEN
    await run();

    // THEN
    expect(mockPaginate).toHaveBeenCalledTimes(2);
    expect(mockPaginate).toHaveBeenNthCalledWith(
      1,
      mockListIssues,
      {
        owner: 'cdk8s-mock-owner',
        repo: 'cdk8s-mock-repo',
        per_page: 100,
      },
    );
    expect(mockPaginate).toHaveBeenNthCalledWith(
      2,
      mockListDependabotAlerts,
      {
        owner: 'cdk8s-mock-owner',
        repo: 'cdk8s-mock-repo',
        per_page: 100,
      },
    );

    expect(mockCreateIssue).not.toHaveBeenCalled();
  });

  test('does not create issue for any other status than open for security alert', async () => {
    // GIVEN
    const otherStatusDepAlerts = [
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
    ];
    mockPagination(listIssuesDefaultVal, otherStatusDepAlerts);

    // WHEN
    await run();

    // THEN
    expect(mockPaginate).toHaveBeenCalledTimes(2);
    expect(mockPaginate).toHaveBeenNthCalledWith(
      1,
      mockListIssues,
      {
        owner: 'cdk8s-mock-owner',
        repo: 'cdk8s-mock-repo',
        per_page: 100,
      },
    );
    expect(mockPaginate).toHaveBeenNthCalledWith(
      2,
      mockListDependabotAlerts,
      {
        owner: 'cdk8s-mock-owner',
        repo: 'cdk8s-mock-repo',
        per_page: 100,
      },
    );

    expect(mockCreateIssue).not.toHaveBeenCalled();
  });

  test('disregards pull requests WHEN creating issue', async () => {
    // GIVEN
    const pullRequestIssue = [{
      labels: [DEPENDABOT_SECURITY_ALERT_LABEL],
      title: issueTitle,
      state: 'open',
      pull_request: 'some_pr',
    }];
    mockPagination(pullRequestIssue, listDepAlertDefaultVal);

    // WHEN
    await run();

    // THEN
    expect(mockPaginate).toHaveBeenCalledTimes(2);
    expect(mockPaginate).toHaveBeenNthCalledWith(
      1,
      mockListIssues,
      {
        owner: 'cdk8s-mock-owner',
        repo: 'cdk8s-mock-repo',
        per_page: 100,
      },
    );
    expect(mockPaginate).toHaveBeenNthCalledWith(
      2,
      mockListDependabotAlerts,
      {
        owner: 'cdk8s-mock-owner',
        repo: 'cdk8s-mock-repo',
        per_page: 100,
      },
    );

    expect(mockCreateIssue).toHaveBeenCalled();
    expect(mockCreateIssue).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
      title: issueTitle,
      body: issueBody,
      labels: [
        DEPENDABOT_SECURITY_ALERT_LABEL,
        P0_ISSUE_LABEL,
        TRIAGE_LABEL,
      ],
    });
  });

  test('does not get alerts newer than two days', async () => {
    // GIVEN
    const olderDependabotAlerts = [
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
    ];
    mockPagination(listIssuesDefaultVal, olderDependabotAlerts);

    // WHEN
    await run();

    // THEN
    expect(mockPaginate).toHaveBeenCalledTimes(2);
    expect(mockPaginate).toHaveBeenNthCalledWith(
      1,
      mockListIssues,
      {
        owner: 'cdk8s-mock-owner',
        repo: 'cdk8s-mock-repo',
        per_page: 100,
      },
    );
    expect(mockPaginate).toHaveBeenNthCalledWith(
      2,
      mockListDependabotAlerts,
      {
        owner: 'cdk8s-mock-owner',
        repo: 'cdk8s-mock-repo',
        per_page: 100,
      },
    );

    expect(mockCreateIssue).toHaveBeenCalledTimes(1);
    expect(mockCreateIssue).toHaveBeenCalledWith({
      owner: ownerName,
      repo: repoName,
      title: issueTitle,
      body: issueBody,
      labels: [
        DEPENDABOT_SECURITY_ALERT_LABEL,
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
    jest.clearAllMocks();
    process.env = {
      ...oldEnv,
      OWNER_NAME: ownerName,
      REPO_NAME: repoName,
      GITHUB_TOKEN: token,
    };
  });
});

function mockPagination(listIssuesOutput: listIssuesType[] = listIssuesDefaultVal,
  listDependabotAlertsOutput: listDependabotAlertsType[] = listDepAlertDefaultVal) {
  mockPaginate.mockResolvedValueOnce(listIssuesOutput)
    .mockResolvedValueOnce(listDependabotAlertsOutput);
}

/**
 * Add number of days to current date
 * @param numberOfDays Number of days
 * @returns The new date with added days
 */
function subtractDays(numberOfDays: number, date: Date = new Date()): Date {
  const newDate = new Date(date.setDate(date.getDate() - numberOfDays));

  return newDate;
}