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
  discordBotToken: mandatoryEnv('DISCORD_BOT_TOKEN'),
  teams: Object.freeze(JSON.parse(mandatoryEnv('TEAMS'))),
  backlogApiKey: mandatoryEnv('BACKLOG_API_KEY'),
  logLevel: optionalNumberEnv('LOG_LEVEL',0)
});

export type Config = {
  discordBotToken: string,
  teams: Team[],
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

type EnvKey = 'DISCORD_BOT_TOKEN' | 'BACKLOG_API_KEY' | 'LOG_LEVEL' | 'TEAMS';

