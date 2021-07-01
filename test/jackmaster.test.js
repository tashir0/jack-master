const JackMaster = require('../src/jack-master.js');

const member = (name, id) => ({name, id});
const twoMembers = [member('Taro'), member('Jiro')];
const oneMember = [member('Taro')];
const noMember = [];

describe('assignMeetingRoles', () => {

  it.each([
    [twoMembers, {clerical: undefined}],
    [oneMember, {timeKeeper: undefined, clerical: undefined}],
    [noMember, {facilitator: undefined, timeKeeper: undefined, clerical: undefined}]
  ])('should some roles be undefined when members less than 3', (members, expectation) => {

    const sut = JackMaster(members);

    const result = sut.assignMeetingRoles();

    expect(result).toMatchObject(expectation);
  });

  it('should assign members to each role randomly', () => {

    const sut = JackMaster([member('Taro'), member('Jiro'), member('Hanako')])

    const result = sut.assignMeetingRoles();

    expect(result).toMatchObject({
      facilitator: {name: expect.stringMatching('Taro|Jiro|Hanako')},
      timeKeeper: {name: expect.stringMatching('Taro|Jiro|Hanako')},
      clerical: {name: expect.stringMatching('Taro|Jiro|Hanako')}
    });
  });
});
