import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import CheckBox from '../../buttons/CheckBox';
import DateTimePickerButton from '../../buttons/DateTimePickerButton';
import CustomDropdown from '../../inputs/CustomDropdown';
import CustomInput from '../../inputs/CustomInput';
import VersePicker from '../../inputs/VersePicker';
import Text, {Body} from '../../text/Text';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {translate} from '../../../logic/localization/localization';
import styles, {colors} from '../../../styles/styles';
import {sanitizeStringNumber, useToggleState} from '../../../logic/general';
import {item} from './types';

const prefix = 'createSchedulePopup.';

export function ScheduleInputs(props: {
  chapterValue: string;
  onScheduleDurationChange: (text: string) => void;
  onVersePickerChange: (
    text: 'chapter' | 'selectedItems' | 'verse',
    value: string,
  ) => void;
  scheduleDuration: string;
  selectedItems: item[];
  testID: string;
  verseValue: string;
}) {
  const {
    chapterValue,
    onScheduleDurationChange,
    onVersePickerChange,
    scheduleDuration,
    selectedItems,
    testID,
    verseValue,
  } = props;
  return (
    <View style={style.container}>
      <CustomInput
        testID={testID + '.scheduleDurationInput'}
        title={translate(prefix + 'scheduleDuration')}
        onChangeText={onScheduleDurationChange}
        inputStyle={style.smallInput}
        value={scheduleDuration}
        description={translate(prefix + 'scheduleDurPhld')}
        keyboardType={'decimal-pad'}
      />
      <VersePicker
        testID={testID + '.scheduleVerseInput'}
        title={translate(prefix + 'startingVerse')}
        onChange={onVersePickerChange}
        selectedItems={selectedItems}
        chapterValue={chapterValue}
        verseValue={verseValue}
      />
    </View>
  );
}

function CustomInfoInputs(props: {
  maxPortion: string;
  portionsPerDay: string;
  readingPortionDesc: string;
  setMaxPortion: (newMaxPortion: string) => void;
  setPortionsPerDay: (newPortionsPerDay: string) => void;
  setStartingPortion: (newReadingPortionDesc: string) => void;
  startingPortion: string;
  testID: string;
}) {
  const {
    maxPortion,
    portionsPerDay,
    readingPortionDesc,
    setMaxPortion,
    setPortionsPerDay,
    setStartingPortion,
    startingPortion,
    testID,
  } = props;
  return (
    <View style={style.container}>
      <CustomInput
        testID={testID + '.portionsPerDayInput'}
        title={translate(prefix + 'portionsPerDay', {
          portionDesc: readingPortionDesc,
        })}
        inputStyle={style.smallInput}
        value={portionsPerDay}
        onChangeText={(text: string) => {
          setPortionsPerDay(
            sanitizeStringNumber(portionsPerDay, text, 0, 1000000000000000000),
          );
        }}
        description={translate(prefix + 'portionsPerDayPhld', {
          portionDesc: readingPortionDesc,
        })}
        keyboardType={'decimal-pad'}
      />
      <CustomInput
        testID={testID + '.startingPortionInput'}
        title={translate(prefix + 'startingPortion', {
          portionDesc: readingPortionDesc,
        })}
        inputStyle={style.smallInput}
        value={startingPortion}
        onChangeText={(text: string) => {
          setStartingPortion(
            sanitizeStringNumber(startingPortion, text, 0, 1000000000000000000),
          );
        }}
        description={translate(prefix + 'startingPortionPhld', {
          portionDesc: readingPortionDesc,
        })}
        defaultValue={'0'}
        keyboardType={'decimal-pad'}
      />
      <CustomInput
        testID={testID + '.numberOfPortionsInput'}
        title={translate(prefix + 'numberOfPortions', {
          portionDesc: readingPortionDesc,
        })}
        inputStyle={style.smallInput}
        value={maxPortion}
        onChangeText={(text: string) => {
          setMaxPortion(
            sanitizeStringNumber(maxPortion, text, 0, 1000000000000000000),
          );
        }}
        description={translate(prefix + 'numberOfPortionsPhld', {
          portionDesc: readingPortionDesc,
        })}
        keyboardType={'decimal-pad'}
      />
    </View>
  );
}

export function CustomInputs(props: {
  maxPortion: string;
  portionsPerDay: string;
  readingPortionDesc: string;
  readingPortionSelectedItems: item[];
  setMaxPortion: (newMaxPortion: string) => void;
  setPortionsPerDay: (newPortionsPerDay: string) => void;
  setReadingPortionDesc: (newReadingPortionDesc: string) => void;
  setReadingPortionSelectedItems: (
    newReadingPortionSelectedItems: item[],
  ) => void;
  setStartingPortion: (newStartingPortion: string) => void;
  startingPortion: string;
  testID: string;
}) {
  const {
    maxPortion,
    portionsPerDay,
    readingPortionDesc,
    readingPortionSelectedItems,
    setMaxPortion,
    setPortionsPerDay,
    setReadingPortionDesc,
    setReadingPortionSelectedItems,
    setStartingPortion,
    startingPortion,
    testID,
  } = props;

  const hasReadingPortionDesc = readingPortionDesc ? true : false;
  return (
    <View style={style.container}>
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
          setSelectedItems={(items: item[]) => {
            setReadingPortionSelectedItems(items);
            setReadingPortionDesc(items[0].name);
          }}
          text={readingPortionDesc}
          onTextChange={setReadingPortionDesc}
          width={'100%'}
        />
      </View>

      {hasReadingPortionDesc && (
        <CustomInfoInputs
          testID={testID}
          maxPortion={maxPortion}
          portionsPerDay={portionsPerDay}
          readingPortionDesc={readingPortionDesc}
          setMaxPortion={setMaxPortion}
          setPortionsPerDay={setPortionsPerDay}
          setStartingPortion={setStartingPortion}
          startingPortion={startingPortion}
        />
      )}
    </View>
  );
}

export function AdvancedSettingsSection(props: {
  doesTrack: boolean;
  setDoesTrack: (newDoesTrack: boolean) => void;
  setStartDate: (newStartDate: Date) => void;
  startDate: Date;
  testID: string;
}) {
  const {doesTrack, setDoesTrack, setStartDate, startDate, testID} = props;

  const [isVisible, toggleIsVisible] = useToggleState(false);
  const [iconName, setIconName] = useState('chevron-right');

  useEffect(() => {
    let newIconName = 'expand-more';
    if (!isVisible) {
      newIconName = 'chevron-right';
    }
    setIconName(newIconName);
  }, [isVisible]);
  return (
    <View style={style.container}>
      <Pressable
        testID={testID + '.toggleAdvancedButton'}
        onPress={toggleIsVisible}
        style={style.settingWrapper}>
        <Body style={{color: colors.darkBlue}}>{translate('advanced')}</Body>
        <Icon style={{color: colors.darkBlue, fontSize: 30}} name={iconName} />
      </Pressable>
      {isVisible && (
        <View>
          <View style={style.settingWrapper}>
            <Body>{translate(prefix + 'shouldTrack')}</Body>
            <CheckBox
              testID={testID + '.doesTrackCheckbox'}
              checked={doesTrack}
              onPress={() => setDoesTrack(!doesTrack)}
            />
          </View>
          <View style={style.settingWrapper}>
            <Body style={{alignSelf: 'center'}}>
              {translate('createSchedulePopup.startDate')}
            </Body>
            <DateTimePickerButton
              testID={testID + '.datePicker'}
              mode={'date'}
              onChange={setStartDate}
              time={startDate}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  smallInput: {width: '20%'},
  settingWrapper: {
    ...styles.wrapperContent,
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
});
