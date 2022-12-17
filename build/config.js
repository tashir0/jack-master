"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const isConfigured = (value) => value !== undefined && value.trim().length !== 0;
const mandatoryEnv = (key) => {
    const value = process.env[key];
    if (isConfigured(value)) {
        return value;
    }
    console.log(`Please set ${key}. See README.md for the details.`);
    process.exit(0);
};
const optionalNumberEnv = (key, defaultValue) => {
    const value = process.env[key];
    return isConfigured(value) ? Number.parseInt(value, 10) : defaultValue;
};
exports.config = Object.freeze({
    projectName: mandatoryEnv('PROJECT_NAME'),
    discordBotToken: mandatoryEnv('DISCORD_BOT_TOKEN'),
    teams: Object.freeze(JSON.parse(mandatoryEnv('TEAMS'))),
    backlogHostName: mandatoryEnv('BACKLOG_HOST_NAME'),
    backlogApiKey: mandatoryEnv('BACKLOG_API_KEY'),
    logLevel: optionalNumberEnv('LOG_LEVEL', 0)
});
