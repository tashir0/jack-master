const Backlog = require('../src/backlog');

const apiKey = process.env.BACKLOG_API_KEY;
const hostName = 'atw-proj.backlog.jp';
const projectName = 'SAV';

// user.id = 320254
// user.userId = 't-tashiro'

// t-toyota 417309
// 牧野孝史 306510
// Motoki Kikuchi 202021
// 小菅　亮 347263
// nakayoshi 355421
// ishikawa 8924
// r-ishizaki 417339

describe('repositoryNames', () => {

  it('should return all repository names of the project', async () => {

    const sut = Backlog.createProject(hostName, projectName, apiKey);

    const results = await sut.repositoryNames();

    expect(results.length).toBe(54);
    expect(results[0]).toBe('passenger-v2');
  })
});

describe('listUsers', () => {

  it('should return all Backlog users', async () => {

    const sut = Backlog.createProject(hostName, projectName, apiKey);

    const users = await sut.listUsers();

    expect(users.length).toBe(120);
  });
});

describe.skip('fetchOpenPullRequestsCreatedBy', () => {

  it('should return empty when no open requests', async () => {

    const sut = Backlog.createProject(hostName, projectName, apiKey);

    const requests = await sut.fetchOpenPullRequestsCreatedBy('New_DriverApplication', [347263]);

    expect(requests.length).toBe(0);
  });
});

describe.skip('fetchPullRequestComments', () => {

  it('should return all comments of pull request', async () => {

    const sut = Backlog.createProject(hostName, projectName, apiKey);

    const comments = await sut.fetchPullRequestComments('New_DriverApplication', 279);

    // TODO
  });
});