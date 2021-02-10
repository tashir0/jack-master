// Response for Uptime Robot
const http = require("http");
http
  .createServer(function(request, response) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Discord bot is active now \n");
  })
  .listen(3000);

// Discord bot implements
const discord = require("discord.js");
const client = new discord.Client();

const members = process.env.TEAM_MEMBERS.split(",");
Object.freeze(members);
const jackMaster = require("./jack-master.js");

client.on("ready", message => {
  console.log("bot is ready!");
  client.user.setPresence({ activity: { name: "SAVスプリント" } });
});

client.on("message", message => {
  if (!message.mentions.has(client.user)) {
    return;
  }
  if (message.content.includes("who's first")) {
    const orderedMembers = jackMaster.whosFirst(members);
    message.channel.send(orderedMembers);
  } else if (message.content.includes("who's facilitator")) {
    const roles = jackMaster.whosFacilitator(members);
    message.channel.send(roles);
  } else if (message.content.includes("who's member")) {
    message.channel.send(members.join("\n"));
  } else {
    message.reply(
      "What do you want to know？:\n" + 
      "`who's first`\n" + 
      "`who's facilitator`\n" +
      "`who's member`\n"
    );
  }
});

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  console.log("please set ENV: DISCORD_BOT_TOKEN");
  process.exit(0);
}

client.login(process.env.DISCORD_BOT_TOKEN);
