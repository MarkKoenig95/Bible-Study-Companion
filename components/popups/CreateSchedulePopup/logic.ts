import {useState} from 'react';

import {translate} from '../../../logic/localization/localization';
import {
  sanitizeStringNumber,
  ScheduleType,
  SCHEDULE_TYPES,
} from '../../../logic/general';
import {item, onAddFunc} from './types';

const prefix = 'createSchedulePopup.';

let defaultSelectedItems: item[] | [] = [];

export function useCreateSchedulePopup(props: {
  onAdd: onAddFunc;
  onError: (error: string) => void;
  type: ScheduleType;
}) {
  const {onAdd, onError, type} = props;

  //State and defaults for schedule info inputs
  const defaults = {
    scheduleName: '',
    scheduleDuration: '1',
    chapter: '1',
    verse: '1',
    selectedItems: defaultSelectedItems,
  };

  const [readingPortionDesc, setReadingPortionDesc] = useState('');
  const [portionsPerDay, setPortionsPerDay] = useState('');
  const [startingPortion, setStartingPortion] = useState('1');
  const [maxPortion, setMaxPortion] = useState('');
  const [scheduleName, setScheduleName] = useState(defaults.scheduleName);
  const [scheduleDuration, setScheduleDuration] = useState(
    defaults.scheduleDuration,
  );
  const [doesTrack, setDoesTrack] = useState(true);
  const [startDate, setStartDate] = useState(new Date());

  const [readingPortionSelectedItems, setReadingPortionSelectedItems] =
    useState(defaultSelectedItems);

  const [versePicker, setVersePicker] = useState({
    chapter: defaults.chapter,
    verse: defaults.verse,
    selectedItems: defaults.selectedItems,
  });

  const isCustom = type === SCHEDULE_TYPES.CUSTOM ? true : false;

  function onVersePickerChange(
    key: 'chapter' | 'verse' | 'selectedItems',
    value: string,
  ) {
    if (key !== 'selectedItems') {
      value = sanitizeStringNumber(versePicker[key], value, 1, 200);
    }

    setVersePicker((prevVals) => {
      return {...prevVals, [key]: value};
    });
  }

  function onScheduleDurationChange(text: string) {
    let sanitizedState = sanitizeStringNumber(scheduleDuration, text, 0, 20);
    setScheduleDuration(sanitizedState);
  }

  function onAddPress() {
    let areAllRequiredFilledIn;
    if (!isCustom) {
      areAllRequiredFilledIn =
        versePicker.selectedItems.length > 0 &&
        scheduleName &&
        scheduleDuration &&
        versePicker.chapter &&
        versePicker.verse;
    } else {
      areAllRequiredFilledIn =
        scheduleName &&
        readingPortionDesc &&
        portionsPerDay &&
        startingPortion &&
        maxPortion &&
        parseFloat(portionsPerDay) > 0;
    }

    if (areAllRequiredFilledIn) {
      let bookId = 1;

      if (versePicker.selectedItems.length > 0) {
        bookId = versePicker.selectedItems[0].id;
      }

      onAdd(
        scheduleName,
        doesTrack,
        parseFloat(scheduleDuration),
        bookId,
        parseFloat(versePicker.chapter),
        parseFloat(versePicker.verse),
        parseFloat(startingPortion),
        parseFloat(maxPortion),
        readingPortionDesc,
        parseFloat(portionsPerDay),
        startDate,
      );
      setScheduleName(defaults.scheduleName);
      setScheduleDuration(defaults.scheduleDuration);
      setVersePicker({
        chapter: defaults.chapter,
        verse: defaults.verse,
        selectedItems: versePicker.selectedItems,
      });
      setReadingPortionDesc('');
      setPortionsPerDay('');
      setStartingPortion('1');
      setMaxPortion('');
      setDoesTrack(true);
      setStartDate(new Date());

      setReadingPortionSelectedItems([]);
    } else {
      onError(translate(prefix + 'unfinished'));
    }
  }
  return {
    doesTrack,
    isCustom,
    maxPortion,
    onAddPress,
    onScheduleDurationChange,
    onVersePickerChange,
    portionsPerDay,
    readingPortionDesc,
    readingPortionSelectedItems,
    scheduleDuration,
    scheduleName,
    setDoesTrack,
    setMaxPortion,
    setPortionsPerDay,
    setReadingPortionDesc,
    setReadingPortionSelectedItems,
    setScheduleName,
    setStartDate,
    setStartingPortion,
    startDate,
    startingPortion,
    versePicker,
  };
}
