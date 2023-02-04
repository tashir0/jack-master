const isConfigured = (value) => value !== undefined && value.trim().length !== 0;
const mandatoryEnv = (key) => {
    const value = process.env[key];
    if (isConfigured(value)) {
        return value;
    }
    logger.error(`Please set ${key}. See README.md for the details.`);
    process.exit(0);
};
const optionalNumberEnv = (key, defaultValue) => {
    const value = process.env[key];
    return isConfigured(value) ? Number.parseInt(value, 10) : defaultValue;
};
export const config = Object.freeze({
    projectName: mandatoryEnv('PROJECT_NAME'),
    discordBotToken: mandatoryEnv('DISCORD_BOT_TOKEN'),
    teams: Object.freeze(JSON.parse(mandatoryEnv('TEAMS'))),
    backlogHostName: mandatoryEnv('BACKLOG_HOST_NAME'),
    backlogApiKey: mandatoryEnv('BACKLOG_API_KEY'),
    // 0: INFO, 1: DEBUG
    logLevel: optionalNumberEnv('LOG_LEVEL', 0)
});
const LogLevel = {
    INFO: 0,
    DEBUG: 1,
};
const timestamp = () => new Date().toLocaleString('ja-JP');
export const logger = {
    info: (message) => console.log(`${timestamp()} [INFO] ${message}`),
    error: (message) => console.log(`${timestamp()} [ERROR] ${message}`),
    debug: (message) => {
        config.logLevel >= LogLevel.DEBUG && console.log(`${timestamp()} [DEBUG] ${message}`);
    }
};
//# sourceMappingURL=config.js.map