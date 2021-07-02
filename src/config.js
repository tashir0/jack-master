const mandatoryConfigItemNames = [
  'DISCORD_BOT_TOKEN',
  'TEAMS'
];

const isNotConfigured = (value) => value === undefined || value.trim().length === 0;

(function environmentVariablesCheck() {
  const lacksMandatoryItem = mandatoryConfigItemNames
  .filter(configName => isNotConfigured(process.env[configName]))
  .filter(configName => {
    console.log(`Please set ${configName}. See README.md for the details.`);
    return true;
  }) // would be nice if we can peek in javascript
  .reduce(() => true, false);
  if (lacksMandatoryItem) {
    process.exit(0);
  }
})();

module.exports = Object.freeze({
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  TEAMS: Object.freeze(JSON.parse(process.env.TEAMS))
});
