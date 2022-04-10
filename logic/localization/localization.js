import React, {useCallback, useEffect, useState} from 'react';
import {I18nManager} from 'react-native';
import * as RNLocalize from 'react-native-localize';
import i18n from 'i18n-js';
import memoize from 'lodash.memoize'; // Use for caching/memoize for better performance
import en from './translations/en.json';
import es from './translations/es.json';
import es_mx from './translations/es-mx.json';
import hu from './translations/hu.json';
import it from './translations/it.json';
import sq from './translations/sq.json';
import zh from './translations/zh.json';

export const languages = {
  en: {language: en.language, isRTL: false},
  es: {language: es.language, isRTL: false},
  'es-mx': {language: es_mx.language, isRTL: false},
  hu: {language: hu.language, isRTL: false},
  it: {language: it.language, isRTL: false},
  sq: {language: sq.language, isRTL: false},
  zh: {language: zh.language, isRTL: false},
};

const translationGetters = {
  // lazy requires (metro bundler does not support symlinks)
  en: () => require('./translations/en.json'),
  es: () => require('./translations/es.json'),
  'es-mx': () => require('./translations/es-mx.json'),
  it: () => require('./translations/it.json'),
  hu: () => require('./translations/hu.json'),
  sq: () => require('./translations/sq.json'),
  zh: () => require('./translations/zh.json'),
};

const translator = memoize(
  (key, config) => i18n.t(key, config),
  (key, config) => (config ? key + JSON.stringify(config) : key),
);

export function translate() {
  return translator(...arguments);
}
/**
 * @param {object | undefined} forceTranslation {languageTag: string, isRTL: boolean}
 */
const setI18nConfig = (forceTranslation) => {
  // fallback if no available language fits
  const fallback = {languageTag: 'en', isRTL: false};

  const translation =
    forceTranslation ||
    RNLocalize.findBestAvailableLanguage(Object.keys(translationGetters));

  const {languageTag, isRTL} = translation || fallback;

  // clear translation cache
  translator.cache.clear();
  // update layout direction
  I18nManager.forceRTL(isRTL);
  // set i18n-js config
  i18n.translations = {[languageTag]: translationGetters[languageTag]()};
  i18n.locale = languageTag;
};

export const useLocalization = (forceTranslation) => {
  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  setI18nConfig(forceTranslation);

  const handleLocalizationChange = (forceTranslation) => {
    if (forceTranslation && !forceTranslation.languageTag) {
      forceTranslation = null;
    }

    setI18nConfig(forceTranslation);
    forceUpdate();
  };

  useEffect(() => {
    RNLocalize.addEventListener('change', handleLocalizationChange);

    return RNLocalize.removeEventListener('change', handleLocalizationChange);
  });

  return {forceUpdate, handleLocalizationChange};
};

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
  args.map((item) => {
    if (item !== 'nwtsty' && item !== 'study-bible') {
      let trans = translate(linkPrefix + item);

      res = translationExists(trans) ? trans : item;

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

export function translationExists(translation) {
  let doesExist;
  try {
    doesExist = translation.slice(0, 10) !== '[missing "';
  } catch (e) {
    console.error(e);
  }
  return doesExist;
}
