const initialEnvValues = { ...process.env };

const setDummyValuesToRequiredConfigsToAvoidProcessExitOnLoad = () => {
  process.env = {
    ...initialEnvValues,
    DISCORD_BOT_TOKEN: 'dummy token',
    TEAM_1: '{}',
    TEAM_2: '{}',
    TEAMS: '{}'
  };
}

beforeEach(() => {
  setDummyValuesToRequiredConfigsToAvoidProcessExitOnLoad();
  jest.resetModules();
});

afterAll(() => process.env = initialEnvValues)

describe('TEAMS', () => {

  it('should have member name, Discord ID and Backlog ID for all defined users', () => {

    process.env.TEAMS =
        '['
        + '{ "members": ['
          + '{ "name": "Taro", "discordId": "111", "backlogId": "100" },'
          + '{ "name": "Jiro", "discordId": "222", "backlogId": "200" },'
          + '{ "name": "Hanako", "discordId": "333", "backlogId": "300" }'
        + ']}, '
        + '{ "members": ['
        + '{ "name": "John", "discordId": "444", "backlogId": "400" },'
        + '{ "name": "Jane", "discordId": "555", "backlogId": "500" }'
        + ']}'
        + ']';

    const sut = require('../src/config.js');

    expect(sut.TEAMS[0]).toStrictEqual({
      members: [
        {name: 'Taro', discordId: '111', backlogId: '100'},
        {name: 'Jiro', discordId: '222', backlogId: '200'},
        {name: 'Hanako', discordId: '333', backlogId: '300'}
      ]});
    expect(sut.TEAMS[1]).toStrictEqual({
      members: [
        {name: 'John', discordId: '444', backlogId: '400'},
        {name: 'Jane', discordId: '555', backlogId: '500'}
      ]});
  });
});
