// Requirements
const moment = require('moment-timezone');

// Format price from stored öre to krona
function priceFormat(num, userOptions = {}) {
  const options = {
    includeOre: userOptions.includeOre || false
  };
  let str = (num / 100).toLocaleString(undefined, {
    minimumFractionDigits: options.includeOre ? 2 : 0,
    maximumFractionDigits: options.includeOre ? 2 : 0
  });
  str = str.replace(',', '');
  str += userOptions.includeSymbol === false ? '' : ' SEK';
  return str;
}

function dateFormat(date, options = {}) {
  let format;
  switch (options.format) {
    case 'week':
      format = '[Week] w';
      break;

    case 'short':
      format = 'YYYY/M/D h:mm:ssa';
      break;

    case 'date':
      format = 'D/M/YYYY';
      break;

    case 'dateFormatter':
      format = 'YYYY-MM-DD';
      break;

    case 'time':
      format = 'h:mm A';
      break;

    case 'shortWording':
      format = 'dddd Do MMMM';
      break;

    case 'long':
    default:
      format = 'dddd Do MMMM YYYY';
      break;
  }
  if (options.includeWeek === true) {
    format += ' [(Week] w[)]';
  }
  return moment(date)
    .tz('Europe/Stockholm')
    .format(format);
}

function parseDateCode(dateCode) {
  const [year, week, day] = dateCode.split('-');
  const weekday = day === undefined ? '3' : day;
  return moment()
    .tz('Europe/Stockholm')
    .year(year)
    .week(week)
    .weekday(weekday);
}

module.exports = {
  priceFormat,
  dateFormat,
  parseDateCode
};
