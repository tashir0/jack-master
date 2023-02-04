const isConfigured = (value?: string): value is string => value !== undefined && value.trim().length !== 0;

const mandatoryEnv = (key: EnvKey): string => {
  const value = process.env[key];
  if (isConfigured(value)) {
    return value;
  }
  console.log(`Please set ${key}. See README.md for the details.`);
  process.exit(0);
};

const optionalNumberEnv = (key: EnvKey, defaultValue: number): number => {
  const value = process.env[key];
  return isConfigured(value) ? Number.parseInt(value, 10) : defaultValue;
};

export const config: Config = Object.freeze({
  projectName: mandatoryEnv('PROJECT_NAME'),
  discordBotToken: mandatoryEnv('DISCORD_BOT_TOKEN'),
  teams: Object.freeze(JSON.parse(mandatoryEnv('TEAMS'))),
  backlogHostName: mandatoryEnv('BACKLOG_HOST_NAME'),
  backlogApiKey: mandatoryEnv('BACKLOG_API_KEY'),
  // 0: INFO, 1: DEBUG
  logLevel: optionalNumberEnv('LOG_LEVEL',0)
});

const LogLevel = {
  INFO: 0,
  DEBUG: 1,
} as const;

export type Config = {
  projectName: string,
  discordBotToken: string,
  teams: Team[],
  backlogHostName: string,
  backlogApiKey: string,
  logLevel: number
};

export type Member = {
  name: string,
  discordId: string,
  backlogId: string,
};

export type Team = {
  readonly members: Member[]
};

type EnvKey =
    'PROJECT_NAME'
    | 'DISCORD_BOT_TOKEN'
    | 'BACKLOG_HOST_NAME'
    | 'BACKLOG_API_KEY'
    | 'LOG_LEVEL'
    | 'TEAMS';


const timestamp = (): string => new Date().toLocaleString('ja-JP');
export const logger = {
  info: (message: string): void => console.log(`${timestamp()} [INFO] ${message}`),
  error: (message: string): void => console.log(`${timestamp()} [ERROR] ${message}`),
  debug: (message: string): void => {
    config.logLevel >= LogLevel.DEBUG && console.log(`${timestamp()} [DEBUG] ${message}`)
  }
};