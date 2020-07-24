import React, {useState} from 'react';
import {translate} from '../../localization/localization';
import {sanitizeNumber} from '../../logic/logic';

import IconButton from '../buttons/IconButton';
import CustomInput from '../CustomInput';
import VersePicker from '../VersePicker';
import Popup from './Popup';
import {getScheduleTypes} from './ScheduleTypeSelectionPopup';
import CustomDropdown from '../CustomDropdown';
import {View, Text} from 'react-native';
import styles from '../../styles/styles';

const debug = false;

const prefix = 'createSchedulePopup.';

export default function CreateSchedulePopup(props) {
  //State and defaults for schedule info inputs
  const defaults = {
    scheduleName: '',
    scheduleDuration: '',
    chapter: '1',
    verse: '1',
    selectedItems: [],
  };

  const [readingPortionDesc, setReadingPortionDesc] = useState();
  const [portionsPerDay, setPortionsPerDay] = useState();
  const [startingPortion, setStartingPortion] = useState('1');
  const [maxPortion, setMaxPortion] = useState();
  const [scheduleName, setScheduleName] = useState(defaults.scheduleName);
  const [scheduleDuration, setScheduleDuration] = useState(
    defaults.scheduleDuration,
  );

  const [
    readingPortionSelectedItems,
    setReadingPortionSelectedItems,
  ] = useState([]);

  const [versePicker, setVersePicker] = useState({
    chapter: defaults.chapter,
    verse: defaults.verse,
    selectedItems: defaults.selectedItems,
  });

  function onVersePickerChange(key, value) {
    if (key !== 'selectedItems') {
      value = sanitizeNumber(versePicker[key], value, 1, 200);
    }

    setVersePicker(prevVals => {
      return {...prevVals, [key]: value};
    });
  }

  function onScheduleDurationChange(text) {
    let sanitizedState = sanitizeNumber(scheduleDuration, text, 0, 20);
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
        maxPortion;
    }

    if (areAllRequiredFilledIn) {
      let bookId = 1;

      if (versePicker.selectedItems.length > 0) {
        bookId = versePicker.selectedItems[0].id;
      }

      props.onAdd(
        scheduleName,
        scheduleDuration,
        bookId,
        versePicker.chapter,
        versePicker.verse,
        startingPortion,
        maxPortion,
        readingPortionDesc,
        portionsPerDay,
      );
      setScheduleName(defaults.scheduleName);
      setScheduleDuration(defaults.scheduleDuration);
      setVersePicker({
        chapter: defaults.chapter,
        verse: defaults.verse,
        selectedItems: versePicker.selectedItems,
      });
      setReadingPortionDesc();
      setPortionsPerDay();
      setStartingPortion('1');
      setMaxPortion();

      setReadingPortionSelectedItems([]);
    } else {
      props.onError(translate(prefix + 'unfinished'));
    }
  }

  const isCustom = props.type === getScheduleTypes().custom ? true : false;
  const hasReadingPortionDesc = readingPortionDesc ? true : false;

  return (
    <Popup
      displayPopup={props.displayPopup}
      title={translate(prefix + 'createSchedule')}
      onClosePress={props.onClosePress}>
      <CustomInput
        title={translate(prefix + 'scheduleName')}
        onChangeText={setScheduleName}
        value={scheduleName}
        placeholder={translate(prefix + 'scheduleName')}
      />

      {!isCustom && (
        <CustomInput
          title={translate(prefix + 'scheduleDuration')}
          onChangeText={onScheduleDurationChange}
          value={scheduleDuration}
          placeholder={translate(prefix + 'scheduleDurPhld')}
          keyboardType={'decimal-pad'}
        />
      )}
      {!isCustom && (
        <VersePicker
          title={translate(prefix + 'startingVerse')}
          onChange={onVersePickerChange}
          selectedItems={versePicker.selectedItems}
          chapterValue={versePicker.chapter}
          verseValue={versePicker.verse}
        />
      )}
      {isCustom && (
        <View style={styles.inputContainer}>
          <Text style={{...styles.lightText, ...props.titleStyle}}>
            {translate(prefix + 'readingPortionDesc.title')}
          </Text>
          <CustomDropdown
            items={[
              {name: translate(prefix + 'readingPortionDesc.article')},
              {name: translate(prefix + 'readingPortionDesc.chapter')},
              {name: translate(prefix + 'readingPortionDesc.page')},
              {name: translate(prefix + 'readingPortionDesc.paragraph')},
            ]}
            placeholder={translate(prefix + 'readingPortionDescPhld')}
            selectedItems={readingPortionSelectedItems}
            setSelectedItems={items => {
              setReadingPortionSelectedItems(items);
              setReadingPortionDesc(items[0].name);
            }}
            text={readingPortionDesc}
            onTextChange={setReadingPortionDesc}
            width={'100%'}
          />
        </View>
      )}
      {isCustom && hasReadingPortionDesc && (
        <CustomInput
          title={translate(prefix + 'portionsPerDay', {
            portionDesc: readingPortionDesc,
          })}
          value={portionsPerDay}
          onChangeText={text => {
            setPortionsPerDay(
              sanitizeNumber(portionsPerDay, text, 0, 1000000000000000000),
            );
          }}
          placeholder={translate(prefix + 'portionsPerDayPhld', {
            portionDesc: readingPortionDesc,
          })}
          keyboardType={'decimal-pad'}
        />
      )}
      {isCustom && hasReadingPortionDesc && (
        <CustomInput
          title={translate(prefix + 'startingPortion', {
            portionDesc: readingPortionDesc,
          })}
          value={startingPortion}
          onChangeText={text => {
            setStartingPortion(
              sanitizeNumber(startingPortion, text, 0, 1000000000000000000),
            );
          }}
          placeholder={translate(prefix + 'startingPortionPhld', {
            portionDesc: readingPortionDesc,
          })}
          defaultValue={'0'}
          keyboardType={'decimal-pad'}
        />
      )}
      {isCustom && hasReadingPortionDesc && (
        <CustomInput
          title={translate(prefix + 'numberOfPortions', {
            portionDesc: readingPortionDesc,
          })}
          value={maxPortion}
          onChangeText={text => {
            setMaxPortion(
              sanitizeNumber(maxPortion, text, 0, 1000000000000000000),
            );
          }}
          placeholder={translate(prefix + 'numberOfPortionsPhld', {
            portionDesc: readingPortionDesc,
          })}
          keyboardType={'decimal-pad'}
        />
      )}
      <IconButton name="add" onPress={onAddPress} />
    </Popup>
  );
}
