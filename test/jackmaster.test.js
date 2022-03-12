const JackMaster = require('../src/jack-master.ts');

const member = (name, discordId, backlogId) => ({name, discordId, backlogId});

const taro = member('Taro', 111, 100);
const jiro = member('Jiro', 222, 200);
const hanako = member('Hanako', 333, 300);
const momoko = member('Momoko', 444, 400);

const twoMembers = [taro, jiro];
const oneMember = [hanako];
const noMember = [];

const repository = (name, lastPushed) => ({name, lastPushed});

const dummyRepository = repository('dummyRepository', '2999-12-31T23:59:59+09:00');

describe('isMasterOf', () => {

  it.each([1, 3])('should be true when a member with the ID exists in a team', (id) => {

    const memberWithId1 = member('dummy', 1);
    const memberWithId3 = member('dummy', 3);
    const members = [memberWithId1, memberWithId3];
    const sut = JackMaster({members});

    const result = sut.isMasterOf(id);

    expect(result).toBeTruthy();
  });

  it.each([0, 2, 4])('should be false when a member with the ID does not exist in a team', (id) => {

    const memberWithId1 = member('dummy', 1);
    const memberWithId3 = member('dummy', 3);
    const members = [memberWithId1, memberWithId3];
    const sut = JackMaster({members});

    const result = sut.isMasterOf(id);

    expect(result).toBeFalsy();
  });
});

describe('members', () => {

  it('should return all members', () => {

    const members = [taro, hanako, jiro];
    const sut = JackMaster({members});

    const result = sut.members();

    expect(result).toStrictEqual([taro, hanako, jiro]);
  });
})

describe('order', () => {

  it('should return all members', () => {

    const members = [taro, hanako, jiro];

    const sut = JackMaster({members});

    const result = sut.order();

    expect(result.length).toBe(members.length);
    expect(result).toContain(taro);
    expect(result).toContain(hanako);
    expect(result).toContain(jiro);
  });

  it('should order randomly every time', () => {

    const members = [taro, hanako, jiro, momoko];

    const sut = JackMaster({members});

    const firstTime = sut.order();
    const secondTime = sut.order();

    // FIXME Fails with a certain probability
    const nameOrderOfFirstTime = firstTime.map(m => m.name).join(",");
    const nameOrderOfSecondTime = secondTime.map(m => m.name).join(",");
    expect(nameOrderOfFirstTime).not.toBe(nameOrderOfSecondTime);
  });
});

describe('assignMeetingRoles', () => {

  it.each([
    [twoMembers, {clerical: undefined}],
    [oneMember, {timeKeeper: undefined, clerical: undefined}],
    [noMember, {facilitator: undefined, timeKeeper: undefined, clerical: undefined}]
  ])('should some roles be undefined when members less than 3', (members, expectation) => {

    const sut = JackMaster({members});

    const result = sut.assignMeetingRoles();

    expect(result).toMatchObject(expectation);
  });

  it('should assign members to each role randomly', () => {

    const members = [taro, jiro, hanako];
    const sut = JackMaster({members})

    const result = sut.assignMeetingRoles();

    expect(result).toMatchObject({
      facilitator: {name: expect.stringMatching('Taro|Jiro|Hanako')},
      timeKeeper: {name: expect.stringMatching('Taro|Jiro|Hanako')},
      clerical: {name: expect.stringMatching('Taro|Jiro|Hanako')}
    });
  });
});

describe('pickOne', () => {

  it('should return one member randomly', () => {

    const members = [taro, jiro, hanako];
    const sut = JackMaster({members})

    const result = sut.pickOne();

    expect(members).toContain(result);
  });
});

describe('getOpenPullRequests', () => {

  it('should return no pull request if no request of own team', async () => {

    const repositories = jest.fn().mockResolvedValue([dummyRepository])
    const fetchOpenPullRequestsCreatedBy = jest.fn().mockResolvedValue([]);

    const backlogProject = {
      repositories,
      fetchOpenPullRequestsCreatedBy
    };
    const sut = JackMaster(
        { members: [taro]},
        backlogProject);

    const requests = await sut.getOpenPullRequests();

    expect(requests.length).toBe(0);
  });

  it('should fetch pull requests of repositories pushed within a year', async  () => {

    const repositoryName1 = 'repository1';
    const repositoryName2 = 'repository2';
    const repositories = jest.fn()
    .mockResolvedValueOnce([
      repository(repositoryName1, '2021-07-01T00:00:00+09:00'), // FIXME This is current time dependent
      repository(repositoryName2, '2020-01-01T00:00:00+09:00')
    ]);

    const pullRequest = {
      createdUser: {id: taro.backlogId },
      stars: []
    };
    const fetchOpenPullRequestsCreatedBy = jest.fn()
    .mockResolvedValueOnce([pullRequest])
    .mockResolvedValueOnce([]);

    const backlogProject = {
      repositories,
      fetchOpenPullRequestsCreatedBy,
      fetchPullRequestComments: jest.fn().mockResolvedValueOnce([])
    };
    const sut = JackMaster(
        { members: [taro]},
        backlogProject);

    const requests = await sut.getOpenPullRequests();

    expect(fetchOpenPullRequestsCreatedBy).toBeCalledWith(repositoryName1, [taro.backlogId]);
    expect(requests.length).toBe(1);
  });

  it('should return star status of last notified to all', async () => {

    const repositories = jest.fn().mockResolvedValue([repository('dummyRepository', '2999-12-31T23:59:59+09:00')])
    const pullRequest = {
      number: 123,
      createdUser: {id: taro.backlogId},
      stars: [
        {presenter: {id: taro.backlogId}}
      ],
      notifications: [

      ]
    };

    const fetchOpenPullRequestsCreatedBy = jest.fn().mockResolvedValue([pullRequest]);

    const backlogProject = {
      repositories,
      fetchOpenPullRequestsCreatedBy,
      fetchPullRequestComments: jest.fn().mockResolvedValueOnce([])
    };
    const sut = JackMaster(
        { members: [taro, jiro, hanako]},
        backlogProject);

    const requests = await sut.getOpenPullRequests();

    expect(requests.length).toBe(1);
    expect(requests[0]).toMatchObject({
      repositoryName: 'dummyRepository',
      requestNumber: 123,
      commentUrl: 'https://atw-proj.backlog.jp/git/SAV/dummyRepositoryName/pullRequests/123#commentId',
      starPresenters: [taro]
    });
  });
});

describe('pair', () => {

  it('should pair team members', () => {

    const sut = JackMaster(
        { members: [taro, jiro, hanako]},
        null);

    const pairs = sut.pair();
    expect(pairs.length).toBe(2);
    const firstPair = pairs[0];
    expect(firstPair.length).toBe(2);
    const secondPair = pairs[1];
    expect(secondPair.length).toBe(1);
  });
});
