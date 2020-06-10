import React, {useCallback, useEffect, useState} from 'react';
import {I18nManager} from 'react-native';
import * as RNLocalize from 'react-native-localize';
import i18n from 'i18n-js';
import memoize from 'lodash.memoize'; // Use for caching/memoize for better performance

const translationGetters = {
  // lazy requires (metro bundler does not support symlinks)
  en: () => require('./translations/en.json'),
  'zh-Hans': () => require('./translations/zh-Hans.json'),
};

export const translate = memoize(
  (key, config) => i18n.t(key, config),
  (key, config) => (config ? key + JSON.stringify(config) : key),
);

const setI18nConfig = () => {
  // fallback if no available language fits
  const fallback = {languageTag: 'en', isRTL: false};

  const {languageTag, isRTL} =
    RNLocalize.findBestAvailableLanguage(Object.keys(translationGetters)) ||
    fallback;

  // clear translation cache
  translate.cache.clear();
  // update layout direction
  I18nManager.forceRTL(isRTL);
  // set i18n-js config
  i18n.translations = {[languageTag]: translationGetters[languageTag]()};
  i18n.locale = languageTag;
};

export const useLocalization = () => {
  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  setI18nConfig();

  const handleLocalizationChange = () => {
    setI18nConfig();
    forceUpdate();
  };

  useEffect(() => {
    RNLocalize.addEventListener('change', handleLocalizationChange);

    return RNLocalize.removeEventListener('change', handleLocalizationChange);
  });

  return {forceUpdate};
};

export function linkFormulator(type) {
  const linkPrefix = `links.${type}.`;
  const langTag = translate('links.languageTag');
  const base = 'https://' + type + '.jw.org/' + langTag;

  let temp = [];
  let args = [...arguments];

  temp.push(base);

  args.shift();
  args.map(item => {
    let res;
    let trans = translate(linkPrefix + item);

    if (trans[0] !== '[') {
      res = trans;
    } else {
      res = item;
    }

    res = encodeURIComponent(res);

    temp.push(res);
  });

  let result = temp.join('/');

  return result;
}
