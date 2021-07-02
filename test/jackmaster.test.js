const JackMaster = require('../src/jack-master.js');

const member = (name, discordId) => ({name, discordId});

const taro = member('Taro');
const jiro = member('Jiro');
const hanako = member('Hanako');

const twoMembers = [taro, jiro];
const oneMember = [hanako];
const noMember = [];

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

    const members = [taro, hanako, jiro];

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