import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';

import CheckBox from '../buttons/CheckBox';
import DateTimePickerButton from '../buttons/DateTimePickerButton';
import IconButton from '../buttons/IconButton';
import CustomDropdown from '../inputs/CustomDropdown';
import CustomInput from '../inputs/CustomInput';
import VersePicker from '../inputs/VersePicker';
import Text, {Body} from '../text/Text';
import Popup from './Popup';

import {translate} from '../../logic/localization/localization';
import styles from '../../styles/styles';
import {sanitizeNumber, SCHEDULE_TYPES} from '../../logic/general';

const prefix = 'createSchedulePopup.';

export default function CreateSchedulePopup(props) {
  const {displayPopup, onAdd, onClosePress, onError, testID, type} = props;

  //State and defaults for schedule info inputs
  const defaults = {
    scheduleName: '',
    scheduleDuration: '1',
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
  const [doesTrack, setDoesTrack] = useState(true);
  const [startDate, setStartDate] = useState(new Date());

  const [readingPortionSelectedItems, setReadingPortionSelectedItems] =
    useState([]);

  const [versePicker, setVersePicker] = useState({
    chapter: defaults.chapter,
    verse: defaults.verse,
    selectedItems: defaults.selectedItems,
  });

  function onVersePickerChange(key, value) {
    if (key !== 'selectedItems') {
      value = sanitizeNumber(versePicker[key], value, 1, 200);
    }

    setVersePicker((prevVals) => {
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
        maxPortion &&
        parseFloat(portionsPerDay, 10) > 0;
    }

    if (areAllRequiredFilledIn) {
      let bookId = 1;

      if (versePicker.selectedItems.length > 0) {
        bookId = versePicker.selectedItems[0].id;
      }

      onAdd(
        scheduleName,
        doesTrack,
        scheduleDuration,
        bookId,
        versePicker.chapter,
        versePicker.verse,
        startingPortion,
        maxPortion,
        readingPortionDesc,
        portionsPerDay,
        startDate,
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
      setStartDate(new Date());

      setReadingPortionSelectedItems([]);
    } else {
      onError(translate(prefix + 'unfinished'));
    }
  }

  const isCustom = type === SCHEDULE_TYPES.CUSTOM ? true : false;
  const hasReadingPortionDesc = readingPortionDesc ? true : false;

  return (
    <Popup
      testID={testID}
      displayPopup={displayPopup}
      title={translate(prefix + 'createSchedule')}
      onClosePress={onClosePress}>
      <CustomInput
        testID={testID + '.scheduleNameInput'}
        title={translate(prefix + 'scheduleName')}
        onChangeText={setScheduleName}
        value={scheduleName}
        placeholder={translate(prefix + 'scheduleName')}
      />

      {!isCustom && (
        <CustomInput
          testID={testID + '.scheduleDurationInput'}
          title={translate(prefix + 'scheduleDuration')}
          onChangeText={onScheduleDurationChange}
          inputStyle={style.smallInput}
          value={scheduleDuration}
          description={translate(prefix + 'scheduleDurPhld')}
          keyboardType={'decimal-pad'}
        />
      )}
      {!isCustom && (
        <VersePicker
          testID={testID + '.scheduleVerseInput'}
          title={translate(prefix + 'startingVerse')}
          onChange={onVersePickerChange}
          selectedItems={versePicker.selectedItems}
          chapterValue={versePicker.chapter}
          verseValue={versePicker.verse}
        />
      )}
      {isCustom && (
        <View style={styles.inputContainer}>
          <Text style={styles.lightText}>
            {translate(prefix + 'readingPortionDesc.title')}
          </Text>
          <CustomDropdown
            testID={testID + '.portionDescriptionDropdown'}
            items={[
              {name: translate(prefix + 'readingPortionDesc.article')},
              {name: translate(prefix + 'readingPortionDesc.chapter')},
              {name: translate(prefix + 'readingPortionDesc.page')},
              {name: translate(prefix + 'readingPortionDesc.paragraph')},
            ]}
            placeholder={translate(prefix + 'readingPortionDescPhld')}
            selectedItems={readingPortionSelectedItems}
            setSelectedItems={(items) => {
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
          testID={testID + '.portionsPerDayInput'}
          title={translate(prefix + 'portionsPerDay', {
            portionDesc: readingPortionDesc,
          })}
          inputStyle={style.smallInput}
          value={portionsPerDay}
          onChangeText={(text) => {
            setPortionsPerDay(
              sanitizeNumber(portionsPerDay, text, 0, 1000000000000000000),
            );
          }}
          description={translate(prefix + 'portionsPerDayPhld', {
            portionDesc: readingPortionDesc,
          })}
          keyboardType={'decimal-pad'}
        />
      )}
      {isCustom && hasReadingPortionDesc && (
        <CustomInput
          testID={testID + '.startingPortionInput'}
          title={translate(prefix + 'startingPortion', {
            portionDesc: readingPortionDesc,
          })}
          inputStyle={style.smallInput}
          value={startingPortion}
          onChangeText={(text) => {
            setStartingPortion(
              sanitizeNumber(startingPortion, text, 0, 1000000000000000000),
            );
          }}
          description={translate(prefix + 'startingPortionPhld', {
            portionDesc: readingPortionDesc,
          })}
          defaultValue={'0'}
          keyboardType={'decimal-pad'}
        />
      )}
      {isCustom && hasReadingPortionDesc && (
        <CustomInput
          testID={testID + '.numberOfPortionsInput'}
          title={translate(prefix + 'numberOfPortions', {
            portionDesc: readingPortionDesc,
          })}
          inputStyle={style.smallInput}
          value={maxPortion}
          onChangeText={(text) => {
            setMaxPortion(
              sanitizeNumber(maxPortion, text, 0, 1000000000000000000),
            );
          }}
          description={translate(prefix + 'numberOfPortionsPhld', {
            portionDesc: readingPortionDesc,
          })}
          keyboardType={'decimal-pad'}
        />
      )}
      <View style={[styles.wrapperContent, {justifyContent: 'space-around'}]}>
        <Body>{translate(prefix + 'shouldTrack')}</Body>
        <CheckBox
          testID={testID + '.doesTrackCheckbox'}
          checked={doesTrack}
          onPress={() => setDoesTrack(!doesTrack)}
        />
      </View>
      <View style={[styles.wrapperContent, {justifyContent: 'space-around'}]}>
        <Body>{translate('createSchedulePopup.startDate')}</Body>
        <DateTimePickerButton
          testID={testID + '.datePicker'}
          mode={'date'}
          onChange={setStartDate}
          time={startDate}
        />
      </View>
      <IconButton
        testID={testID + '.addButton'}
        name="add"
        onPress={onAddPress}
      />
    </Popup>
  );
}

const style = StyleSheet.create({
  smallInput: {width: '20%'},
});
