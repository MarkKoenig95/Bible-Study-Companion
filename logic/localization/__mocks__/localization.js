const en = require('../translations/en.json');

export function translate(keyString, parameters) {
  let value = translator(keyString, en);

  if (parameters) {
    Object.keys(parameters).forEach(key => {
      let re = new RegExp(`{{${key}}}`, 'g');
      value = value.replace(re, parameters[key]);
    });
  }
  return value;
}

function translator(keyString, obj) {
  let keys = keyString.split('.');

  let newObj = obj[keys[0]];

  keys.shift();

  if (keys.length === 0) {
    return newObj;
  }

  let newKeyString = keys.join('.');

  return translator(newKeyString, newObj);
}

export function linkFormulator(type) {
  const linkPrefix = `links.${type}.`;
  const langTag = translate('links.languageTag');
  const hasStudyBible = translate('links.hasStudyBible');
  const base = 'https://' + type + '.jw.org/' + langTag;

  let res;
  let temp = [];
  let args = [...arguments];

  temp.push(base);

  //Remove type argument and leave all others meant for link
  args.shift();
  args.map(item => {
    if (item !== 'nwtsty' && item !== 'study-bible') {
      let trans = translate(linkPrefix + item);

      res = trans;

      //If we do not encode it as a URI this will cause issues later
      res = encodeURIComponent(res);
    } else {
      res = hasStudyBible ? item : 'nwt';
    }

    temp.push(res);
  });

  let result = temp.join('/');

  return result;
}

export function dateFormulator(year, approxDesc) {
  const prefix = 'date.';
  year = parseInt(year, 10);
  let desc = '';

  if (year < 0) {
    desc = translate(prefix + 'bce');
  } else {
    desc = translate(prefix + 'ce');
  }

  let date = translate(prefix + 'ancientDate', {
    year: Math.abs(year),
    bceOrCe: desc,
  });

  let approxPrefix = prefix + 'approxDesc.';

  let approxDateValues = {
    about: '',
    after: '',
    before: '',
    date: date,
  };

  if (approxDesc) {
    let approx = translate(approxPrefix + approxDesc);
    approxDateValues[approxDesc] = approx;
  }

  let dateString = translate(approxPrefix + 'approxDate', approxDateValues);

  return dateString;
}
