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

  it('should have member name and Discord ID for all defined users', () => {

    process.env.TEAMS =
        '['
        + '{ "members": ['
          + '{ "name": "Taro", "discordId": "111" },'
          + '{ "name": "Jiro", "discordId": "222" },'
          + '{ "name": "Hanako", "discordId": "333"}'
        + ']}, '
        + '{ "members": ['
        + '{ "name": "John", "discordId": "444" },'
        + '{ "name": "Jane", "discordId": "555" }'
        + ']}'
        + ']';

    const sut = require('../src/config.js');

    expect(sut.TEAMS[0]).toStrictEqual({
      members: [
        {name: 'Taro', discordId: '111'},
        {name: 'Jiro', discordId: '222'},
        {name: 'Hanako', discordId: '333'}
      ]});
    expect(sut.TEAMS[1]).toStrictEqual({
      members: [
        {name: 'John', discordId: '444'},
        {name: 'Jane', discordId: '555'}
      ]});
  });
});
