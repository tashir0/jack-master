const randomIntOfMax = max => Math.floor(Math.random() * Math.floor(max));
const extractRandomly = items => items.splice(randomIntOfMax(items.length), 1)[0];

module.exports = {

  order: (members) => {
    const tempMembers = members.concat();
    const numOfMembers = members.length;
    let result = "";
    for (let i = 0; i < numOfMembers; i++) {
      const member = extractRandomly(tempMembers);
      result += `${i + 1}: ${member.name}\n`;
    }
    return result;
  },

  assignMeetingRoles: (members) => {
    if (members.length < 3) {
      return 'At least 3 members are required to start a meeting';
    }
    const tempMembers = members.concat();
    const facilitator = extractRandomly(tempMembers);
    const timeKeeper = extractRandomly(tempMembers);
    const clerical = extractRandomly(tempMembers);
    return `ファシリテーター: ${facilitator.name}\nタイム・キーパー: ${timeKeeper.name}\n書記: ${clerical.name}`;
  },

  pickOne: (members) => {
    const tempMembers = members.concat();
    return extractRandomly(tempMembers).name;
  }
};
