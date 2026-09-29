module.exports = (hhmm, minutes) => {
  const [hours, mins] = hhmm.split(':').map(Number);
  const total = hours * 60 + minutes + mins;
  const outHours = Math.floor(total / 60);
  const outMins = total % 60;
  return String(outHours).padStart(2, '0') + ':' + String(outMins).padStart(2, '0');
}