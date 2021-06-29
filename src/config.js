const mandatoryConfigItemNames = [
  'DISCORD_BOT_TOKEN',
  'TEAM_1_MEMBERS',
  'TEAM_2_MEMBERS'
];
(function environmentVariablesCheck() {
  const lacksMandatoryItem = mandatoryConfigItemNames
  .filter(configName => (process.env[configName] === undefined))
  .filter(configName => {
    console.log(`Please set ${configName}. See README.md for the details.`);
    return true;
  }) // would be nice if we can peek in javascript
  .reduce(() => true, false);
  if (lacksMandatoryItem) {
    process.exit(0);
  }
})();

const parseTeamMembers = (configValue) => {
  return configValue.split(',')
  .map(memberConfig => {
    const tokens = memberConfig.split(':');
    return Object.freeze({
      name: tokens[0],
      discordId: tokens[1]
    });
  });
};

const team1members = parseTeamMembers(process.env.TEAM_1_MEMBERS);
const team2members = parseTeamMembers(process.env.TEAM_2_MEMBERS);

module.exports = Object.freeze({
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  TEAM_1_MEMBERS: team1members,
  TEAM_2_MEMBERS: team2members,
});
