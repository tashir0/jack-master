const env = require('./environment.js');
const members = env.TEAM_MEMBERS;

const jackMaster = require('./jack-master.js');
module.exports = {
  message: (message) => {
    let candidates = members;

    const args = message.content.length >= 1 ?
        message.content.split(' ') :
        [];

    if (args.length > 2) {
      candidates = args.slice(2)
    }

    if (message.content.includes('order')) {
      const orderedMembers = jackMaster.whosFirst(candidates);
      message.channel.send(orderedMembers);
    } else if (message.content.includes('meeting')) {
      const roles = jackMaster.whosFacilitator(candidates);
      message.channel.send(roles);
    } else if (message.content.includes('random')) {
      const theOne = jackMaster.pickOne(candidates);
      message.channel.send(theOne);
    } else if (message.content.includes('members')) {
      message.channel.send(candidates.join('\n'));
    } else {
      message.reply(
          'Available commands:\n' +
          '`order` Lists all team members in a random order\n' +
          '`meeting` Assigns team members to meeting roles\n' +
          '`random` Pick one member randomly\n' +
          '`members` Lists all team members\n'
      );
    }
  }
}
