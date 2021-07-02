const initialEnvValues = { ...process.env };

const setDummyValuesToRequiredConfigsToAvoidProcessExitOnLoad = () => {
  process.env = {
    ...initialEnvValues,
    DISCORD_BOT_TOKEN: 'dummy token',
    TEAM_1_MEMBERS: '',
    TEAM_2_MEMBERS: ''
  };
}

beforeEach(() => {
  setDummyValuesToRequiredConfigsToAvoidProcessExitOnLoad();
  jest.resetModules();
});

afterAll(() => process.env = initialEnvValues)

describe('TEAM_1_MEMBERS', () => {

  it('should have member name and Discord ID for all defined users', () => {

    process.env.TEAM_1_MEMBERS = 'Taro:111,Jiro:222,Hanako:333';

    const sut = require('../src/config.js');

    expect(sut.TEAM_1_MEMBERS).toStrictEqual([
        { name: 'Taro', discordId: '111'},
        { name: 'Jiro', discordId: '222'},
        { name: 'Hanako', discordId: '333'}
    ]);
  });
});

describe('TEAM_2_MEMBERS', () => {

  it('should have member name and Discord ID for all defined users', () => {

    process.env.TEAM_2_MEMBERS = 'Taro:111,Jiro:222,Hanako:333';

    const sut = require('../src/config.js');

    expect(sut.TEAM_2_MEMBERS).toStrictEqual([
      { name: 'Taro', discordId: '111'},
      { name: 'Jiro', discordId: '222'},
      { name: 'Hanako', discordId: '333'}
    ]);
  });
});