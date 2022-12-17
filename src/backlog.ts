import fetch from "node-fetch";

const sleep = (millisecs: number) =>
    (new Promise((resolve) => global.setTimeout(resolve, millisecs)));

export const createBacklogProject = (hostName: string, projectName: string, apiKey: string): BacklogProject => {

  const apiBaseUrl = `https://${hostName}/api/v2`;
  const apiBaseProjectUrl = `${apiBaseUrl}/projects/${projectName}`;

  const pullRequestStatusOpen = '1';

  const arrayParams = (name: string, values: string[]) => values.map(value => `${name}[]=${value}`).join('&');

  const repositories = async (): Promise<GitRepository[]> => {
    const backlogGitRepositories: BacklogGitRepository[] = await fetchAsJson(`${apiBaseProjectUrl}/git/repositories?apiKey=${apiKey}`);
    return backlogGitRepositories.map(toRepository);
  };

  const fetchOpenPullRequestsCreatedBy = async (repositoryName: string, createdUserIds: string[]): Promise<OpenPullRequest[]> => {
    const backlogPullRequests: BacklogPullRequest[] = await fetchAsJson(
        `${apiBaseProjectUrl}/git/repositories/${repositoryName}/pullRequests?` +
        `apiKey=${apiKey}&` +
        `statusId[]=${pullRequestStatusOpen}&` +
        `${arrayParams('createdUserId', createdUserIds)}`);
    return backlogPullRequests.map(pr => ({
      title: pr.summary,
      number: pr.number,
      repositoryName,
      ticketNumber: pr.issue?.issueKey,
      createdUser: pr.createdUser
    }));
  };

  const fetchPullRequestComments = (repositoryName: string, pullRequestId: number) => fetchAsJson(
      `${apiBaseProjectUrl}/git/repositories/${repositoryName}/pullRequests/${pullRequestId}/comments?apiKey=${apiKey}`);

  const listUsers = () => fetchAsJson(`${apiBaseUrl}/users?apiKey=${apiKey}`);

  const pullRequestUrl = (repositoryName: string, requestNumber: number) => `https://${hostName}/git/${projectName}/${repositoryName}/pullRequests/${requestNumber}`;

  const ticketUrl = (ticketNumber: number) => `https://${hostName}/view/${ticketNumber}`;

  return {
    repositories,
    fetchOpenPullRequestsCreatedBy,
    fetchPullRequestComments,
    listUsers,
    pullRequestUrl,
    ticketUrl,
  };
};

export type BacklogProject = {
  repositories: () => Promise<GitRepository[]>,
  fetchOpenPullRequestsCreatedBy: (repositoryName: string, createdUserIds: string[]) => Promise<OpenPullRequest[]>,
  fetchPullRequestComments: (repositoryName: string, pullRequestId: number) => Promise<Comment[]>
  listUsers: () => void,
  pullRequestUrl: (repositoryName: string, requestNumber: number) => string,
  ticketUrl: (ticketNumber: number) => string,
};

type BacklogIssue = {
  issueKey: number,
};

type BacklogPullRequest = {
  summary: string,
  number: number,
  repositoryName: string,
  issue?: BacklogIssue,
  createdUser: User,
};

export type User = {
  id: number,
};

export type Notification = {
  user: User,
};

export type Star = {
  presenter: User,
};

export type Comment = {
  createdUser: User,
  notifications: Notification[],
  stars: Star[]
};

export type OpenPullRequest = {
  title: string,
  number: number,
  repositoryName: string,
  /** There may not be a related ticket */
  ticketNumber?: number,
  createdUser: User
};

export type GitRepository = {
  name: string,
  lastPush: string,
};

type BacklogGitRepository = {
  name: string,
  pushedAt: string,
};

const fetchAsJson = async (url: string) => {
  // Backlog prohibits excessive access
  await sleep(300);
  const response = await fetch(url);
  const text = await response.text();
  const json = JSON.parse(text);
  // console.debug(`${new Date()} ${url}\n${JSON.stringify(json, null, "\t")}`);
  return json;
};

const toRepository = (backlogRepository: BacklogGitRepository): GitRepository => ({
  name: backlogRepository.name,
  lastPush: backlogRepository.pushedAt
});

