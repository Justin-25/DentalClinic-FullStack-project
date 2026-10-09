const addMinutes = require('./addMinutes');

module.exports = ({ blocks, busy, duration }) => {
  const slots = [];

  for (const block of blocks) {
    let start = block.startTime;
    
    while (addMinutes(start, duration) <= block.endTime) {
      const end = addMinutes(start, duration);
      const overlaps = busy.some((b) => start < b.end && b.start < end);

      if (!overlaps) slots.push(start);
      start = addMinutes(start, duration);
    }
  }

  return slots;
}