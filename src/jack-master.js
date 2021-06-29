const randomIntOfMax = max => Math.floor(Math.random() * Math.floor(max));
const extractRandomly = items => items.splice(randomIntOfMax(items.length), 1)[0];

module.exports = (members) => {

  return {

    members: () => {
      return members;
    },

    order: () => {
      const tempMembers = members.concat();
      const orderedMembers = [];
      while (0 < tempMembers.length) {
        orderedMembers.push(extractRandomly(tempMembers));
      }
      return orderedMembers;
    },

    assignMeetingRoles: () => {
      const tempMembers = members.concat();
      const facilitator = extractRandomly(tempMembers);
      const timeKeeper = extractRandomly(tempMembers);
      const clerical = extractRandomly(tempMembers);
      return {facilitator, timeKeeper, clerical};
    },

    pickOne: () => {
      const tempMembers = members.concat();
      return extractRandomly(tempMembers);
    }
  };
};
