# jack-master

jack-master is a discord bot to support teams working on Discord.

## Usage
Mention to jack-master bot with command.
```
@jack-master (command)
```

## Features

| Command   | Description                                                                                            |
|-----------|--------------------------------------------------------------------------------------------------------|
| `mambers` | List all members in the team.                                                                          |
| `random`  | Pick one member randomly.                                                                              |
| `order`   | List all team members in a random order.                                                               |
| `meeting` | Assigns following meeting roles to team mebers.<br/>* facilitator<br/>* time keeper<br/>* note taker   |
| `stars`   | List open pull requests in Backlog project.                                                            |
| `pair`    | Pair team mebers.                                                                                      |
| `todo`    | List messages with `TODO` but without `済` stamp within the text channel. Looks up latest 100 messages. |


## Configurations

| Name              | Required | Description                                                      |
|-------------------|----------|------------------------------------------------------------------|
| PROJECT_NAME      | yes      | Name of Backlog project                                          |
| DISCORD_BOT_TOKEN | yes      | Discord bot token                                                |
| TEAMS             | yes      | Teams configuration in JSON format. See [below](#Defining teams) |
| BACKLOG_HOST_NAME | yes      | Host name of Backlog                                             |
| BACKLOG_API_KEY   | yes      | API key for Backlog                                              |


### Defining teams

```
[
  {
    "members": [
      {
        "name": "member1",
        "discordId": "999999999999999999",
        "backlogId": "999999"
      },
      (repeat for all members)
    ]
  },
  (repeat for all teams)
]
```
