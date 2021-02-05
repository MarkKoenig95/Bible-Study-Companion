import React, {useContext, useEffect, useState} from 'react';
import {SafeAreaView, View, StyleSheet, FlatList, Keyboard} from 'react-native';

import MessagePopup, {useMessagePopup} from '../components/popups/MessagePopup';

import IconButton from '../components/buttons/IconButton';
import TextButton from '../components/buttons/TextButton';
import Picker from '../components/inputs/CustomPicker';
import {Body} from '../components/text/Text';
import CheckBox from '../components/buttons/CheckBox';
import CustomInput from '../components/inputs/CustomInput';
import WeekdayPicker from '../components/inputs/WeekdayPicker';

import styles, {colors} from '../styles/styles';

import {store} from '../data/Store/store.js';

import {translate, translationExists} from '../logic/localization/localization';
import {
  useUpdate,
  sanitizeNumber,
  createPickerArray,
  FREQS,
  ERROR,
} from '../logic/logic';
import {
  setReminderCompDate,
  addReminder,
  deleteReminder,
} from '../data/Database/reminderTransactions';
import {loadData, updateValue} from '../data/Database/generalTransactions';
import CreateReminderPopup, {
  useCreateReminderPopup,
} from '../components/popups/CreateReminderPopup';

const pageTitle = 'remindersPage';

const ReminderWrapper = props => {
  const {
    completionDate,
    frequency,
    isFinished,
    itemID,
    name,
    onDeleteReminder,
    onUpdateIsFinished,
    onUpdateReminder,
    resetValue,
    testID,
  } = props;

  //State values for reminder info
  const [freq, setFreq] = useState(frequency);
  const [reminderName, setReminderName] = useState(name);
  const [resetStr, setResetStr] = useState('');
  const [resetVal, setResetVal] = useState(resetValue);

  //State values which control appearance
  const [isDaily, setIsDaily] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isWeekly, setIsWeekly] = useState(false);
  const [isMonthly, setIsMonthly] = useState(false);
  const [isNever, setIsNever] = useState(false);
  const [completedDesc, setCompletedDesc] = useState('');

  const RECURS = {
    [FREQS.DAILY]: translate('frequencies.daily'),
    [FREQS.WEEKLY]: translate('frequencies.weekly'),
    [FREQS.MONTHLY]: translate('frequencies.monthly'),
    [FREQS.NEVER]: translate('frequencies.never'),
  };

  const freqPickerValues = createPickerArray(
    RECURS[FREQS.DAILY],
    RECURS[FREQS.WEEKLY],
    RECURS[FREQS.MONTHLY],
    RECURS[FREQS.NEVER],
  );

  const recursText = RECURS[freq];

  useEffect(() => {
    switch (freq) {
      case FREQS.DAILY:
        setIsDaily(true);
        setIsWeekly(false);
        setIsMonthly(false);
        setIsNever(false);
        setCompletedDesc(translate('today'));
        break;
      case FREQS.WEEKLY:
        setIsDaily(false);
        setIsWeekly(true);
        setIsMonthly(false);
        setIsNever(false);
        setResetStr(translate(`weekdays.${resetVal}.name`));
        setCompletedDesc(translate('thisWeek'));
        break;
      case FREQS.MONTHLY:
        setIsDaily(false);
        setIsWeekly(false);
        setIsMonthly(true);
        setIsNever(false);
        setResetStr(resetVal.toString());
        setCompletedDesc(translate('thisMonth'));
        break;
      case FREQS.NEVER:
        setIsDaily(false);
        setIsWeekly(false);
        setIsMonthly(false);
        setIsNever(true);
        setCompletedDesc('');
        break;
      default:
        console.log('Reminder frequency not defined');
        break;
    }
  }, [freq, resetVal]);
  function onEditCancel() {
    //Disable editing and revert all states back to the values they recieved from
    //props (the values from the table)
    setIsEditing(false);
    setReminderName(name);
    setFreq(frequency);
    setResetVal(resetValue);
  }

  function onEditDone() {
    console.log('resetVal', resetVal, 'resetValue', resetValue);
    setIsEditing(false);
    //Update reminder in the table
    const {newCompDate, newIsFinished} = setReminderCompDate(
      completionDate,
      isFinished,
      frequency,
      resetValue,
      freq,
      resetVal,
    );

    onUpdateReminder(
      itemID,
      reminderName,
      newIsFinished ? 1 : 0,
      freq,
      resetVal,
      newCompDate || completionDate,
    );
  }

  function toggleIsFinished() {
    onUpdateIsFinished(itemID, !isFinished);
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.wrapperContent, {width: '95%'}]}>
        {!isEditing && (
          <AdjButtonSection
            testID={testID + '.adjustmentButtons'}
            isEditing={isEditing}
            onDeleteReminder={onDeleteReminder}
            setIsEditing={setIsEditing}
          />
        )}

        <View style={{flex: 6}}>
          <NameSection
            testID={testID + '.nameSection'}
            isEditing={isEditing}
            reminderName={reminderName}
            setReminderName={setReminderName}
          />

          <FrequencySection
            testID={testID + '.frequencySection'}
            isEditing={isEditing}
            freq={freq}
            freqPickerValues={freqPickerValues}
            recursText={recursText}
            setFreq={setFreq}
          />

          {(isWeekly || isMonthly) && (
            <RecursSection
              testID={testID + '.reccurenceSection'}
              isEditing={isEditing}
              isWeekly={isWeekly}
              resetStr={resetStr}
              resetVal={resetVal}
              setResetStr={setResetStr}
              setResetVal={setResetVal}
            />
          )}

          {!isEditing ? (
            <IsCompletedSection
              testID={testID + '.isCompleteSection'}
              completedDesc={completedDesc}
              isFinished={isFinished}
              toggleIsFinished={toggleIsFinished}
            />
          ) : (
            <ActionButtonSection
              testID={testID + '.actionButtons'}
              onEditCancel={onEditCancel}
              onEditDone={onEditDone}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const ActionButtonSection = props => {
  const {onEditCancel, onEditDone, testID} = props;
  return (
    <View testID={testID} style={style.reminderContent}>
      <TextButton
        testID={testID + '.cancelButton'}
        onPress={onEditCancel}
        text={translate('actions.cancel')}
      />
      <TextButton
        testID={testID + '.doneButton'}
        onPress={onEditDone}
        text={translate('actions.done')}
      />
    </View>
  );
};

const AdjButtonSection = props => {
  const {isEditing, onDeleteReminder, setIsEditing, testID} = props;
  return (
    <View testID={testID} style={style.buttonContainer}>
      <IconButton
        testID={testID + '.editButton'}
        buttonStyle={style.editButton}
        iconOnly
        name="edit"
        onPress={() => {
          setIsEditing(!isEditing);
        }}
      />
      <IconButton
        testID={testID + '.deleteButton'}
        buttonStyle={style.deleteButton}
        iconOnly
        name="delete"
        onPress={onDeleteReminder}
      />
    </View>
  );
};

const IsCompletedSection = props => {
  const {completedDesc, isFinished, testID, toggleIsFinished} = props;
  return (
    <View testID={testID} style={style.reminderContent}>
      <Body dark>
        {translate(pageTitle + '.completed', {desc: completedDesc})}
      </Body>
      <CheckBox
        testID={testID + '.checkBox'}
        checked={isFinished}
        onPress={toggleIsFinished}
      />
    </View>
  );
};

const RecursSection = props => {
  let {
    isEditing,
    isWeekly,
    resetVal,
    setResetVal,
    resetStr,
    setResetStr,
    testID,
  } = props;

  let ordinalSpecial = translate('ordinal.special.' + resetVal);
  let ordinalPlain = translate('ordinal.' + (resetVal % 10));
  let ordinal = translationExists(ordinalSpecial)
    ? ordinalSpecial
    : ordinalPlain;
  let isOrdinalAfter = translate('ordinal.after');

  //If it's not editing we display the text as is
  //If it is editing, then we either show a picker for a weekday or we show a numerical input
  return (
    <View testID={testID} style={style.reminderContent}>
      <Body dark style={{alignSelf: 'center'}}>
        {translate(pageTitle + '.every')}
      </Body>
      {!isOrdinalAfter && !isWeekly && (
        <Body
          testID={testID + '.ordinalBefore'}
          dark
          style={{alignSelf: 'center'}}>
          {ordinal}
        </Body>
      )}
      {!isEditing ? (
        <Body
          testID={testID + '.resetValueString'}
          dark
          style={{color: colors.darkBlue}}>
          {resetStr}
        </Body>
      ) : isWeekly ? (
        <WeekdayPicker
          testID={testID + '.weekdayPicker'}
          onChange={setResetVal}
          currentValue={resetVal}
        />
      ) : (
        <CustomInput
          testID={testID + '.resetValueInput'}
          containerStyle={{maxWidth: 100}}
          value={resetStr}
          onChangeText={newValue => {
            let newStr = sanitizeNumber(resetStr, newValue, 1, 31);
            setResetStr(newStr);
            if (newStr) {
              setResetVal(parseInt(newStr, 10));
            }
          }}
          keyboardType={'number-pad'}
          textAlign={'center'}
        />
      )}
      {isOrdinalAfter && !isWeekly && (
        <Body
          testID={testID + '.ordinalAfter'}
          dark
          style={{alignSelf: 'center'}}>
          {ordinal}
        </Body>
      )}
    </View>
  );
};

const FrequencySection = props => {
  let {isEditing, freq, freqPickerValues, recursText, setFreq, testID} = props;
  return (
    <View testID={testID} style={style.reminderContent}>
      <Body dark style={{alignSelf: 'center'}}>
        {translate(pageTitle + '.repeats')}
      </Body>
      {!isEditing ? (
        <Body testID={testID + '.text'} dark style={{color: colors.darkBlue}}>
          {recursText}
        </Body>
      ) : (
        <Picker
          testID={testID + '.picker'}
          onChange={setFreq}
          values={freqPickerValues}
          currentValue={freq}
        />
      )}
    </View>
  );
};

const NameSection = props => {
  let {isEditing, reminderName, setReminderName, testID} = props;
  return (
    <View testID={testID} style={[style.reminderContent, {borderTopWidth: 0}]}>
      <Body dark style={{alignSelf: 'center'}}>
        {translate(pageTitle + '.name')}
      </Body>
      {!isEditing ? (
        <Body
          dark
          style={{
            color: colors.darkBlue,
          }}>
          {reminderName}
        </Body>
      ) : (
        <CustomInput
          value={reminderName}
          onChangeText={setReminderName}
          textAlign={'center'}
        />
      )}
    </View>
  );
};

export default function Reminders(props) {
  const {navigation} = props;

  console.log('loaded reminders page');
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {userDB, updatePages} = globalState.state;
  const [listItems, setListItems] = useState([]);
  const [spacing, setSpacing] = useState(0);

  const {messagePopup, openMessagePopup, closeMessagePopup} = useMessagePopup();
  const {reminderPopup} = useCreateReminderPopup();

  const afterUpdate = useUpdate(updatePages, dispatch);

  //Set up keyboard listeners
  const _keyboardDidShow = () => {
    setSpacing(400);
  };

  const _keyboardDidHide = () => {
    setSpacing(0);
  };

  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', _keyboardDidShow);
    Keyboard.addListener('keyboardDidHide', _keyboardDidHide);

    return () => {
      Keyboard.removeListener('keyboardDidShow', _keyboardDidShow);
      Keyboard.removeListener('keyboardDidHide', _keyboardDidHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData(userDB, 'tblReminders').then(res => {
      setListItems(res);
    });
  }, [userDB, setListItems, updatePages]);

  //Set add button in nav bar with appropriate onPress attribute
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          testID={pageTitle + '.header.addButton'}
          iconOnly
          invertColor
          onPress={reminderPopup.open}
          name="add"
        />
      ),
    });
  }, [navigation, reminderPopup.open]);

  async function onAddReminder(name, frequency, resetValue, completionDate) {
    let hasError;

    await addReminder(userDB, name, frequency, resetValue, completionDate)
      .then(() => {
        reminderPopup.close();
        afterUpdate();
      })
      .catch(err => {
        hasError = err;
        console.log('Error adding reminder:', err);
        if (err === ERROR.NAME_TAKEN) {
          let message = translate('prompts.nameTaken');
          let title = translate('warning');
          openMessagePopup(message, title);
        }
      });

    if (hasError) {
      return;
    }
  }

  async function onUpdateReminder(
    id,
    name,
    isFinished,
    frequency,
    resetValue,
    completionDate,
  ) {
    let updates = [
      {column: 'Name', value: name},
      {column: 'IsFinished', value: isFinished},
      {column: 'Frequency', value: frequency},
      {column: 'ResetValue', value: resetValue},
      {column: 'CompletionDate', value: completionDate.toString()},
    ];
    console.log(updates);

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];

      await updateValue(
        userDB,
        'tblReminders',
        id,
        update.column,
        update.value,
      );
    }

    afterUpdate();
  }

  function onUpdateIsFinished(id, isFinished) {
    updateValue(
      userDB,
      'tblReminders',
      id,
      'IsFinished',
      isFinished,
      afterUpdate,
    );
  }

  function onDeleteReminder(id, name) {
    let message = translate('remindersPage.deleteReminderMessage', {
      reminderName: name,
    });
    openMessagePopup(message, '', () => {
      deleteReminder(userDB, id).then(() => {
        afterUpdate();
      });
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <MessagePopup
        testID={pageTitle + '.messagePopup'}
        displayPopup={messagePopup.isDisplayed}
        title={messagePopup.title}
        message={messagePopup.message}
        onClosePress={closeMessagePopup}
        onConfirm={messagePopup.onConfirm}
      />
      <CreateReminderPopup
        testID={pageTitle + '.createRemindersPopup'}
        displayPopup={reminderPopup.isDisplayed}
        onAddReminder={onAddReminder}
        onClosePress={reminderPopup.close}
        title={reminderPopup.title}
        prefix={pageTitle + '.'}
      />
      <View style={styles.contentWithoutHeader}>
        <FlatList
          data={listItems}
          keyExtractor={(item, index) => index + JSON.stringify(item)}
          renderItem={({item}) => {
            return (
              <ReminderWrapper
                testID={pageTitle + '.reminder.' + item.Name}
                itemID={item.ID}
                completionDate={item.CompletionDate}
                name={item.Name}
                isFinished={item.IsFinished}
                frequency={item.Frequency}
                resetValue={item.ResetValue}
                onUpdateReminder={onUpdateReminder}
                onUpdateIsFinished={onUpdateIsFinished}
                onDeleteReminder={() => {
                  onDeleteReminder(item.ID, item.Name);
                }}
              />
            );
          }}
          ListFooterComponent={<View style={{height: spacing}} />}
        />
      </View>
    </SafeAreaView>
  );
}

const style = StyleSheet.create({
  buttonContainer: {
    alignItems: 'center',
    flex: 1,
  },
  deleteButton: {
    marginTop: 25,
    marginBottom: 0,
  },
  editButton: {
    marginTop: 0,
    marginBottom: 25,
  },
  reminderContent: {
    ...styles.wrapperContent,
    borderColor: colors.darkBlue,
    borderTopWidth: 1,
    flexWrap: 'wrap',
    justifyContent: 'center',
    margin: 0,
  },
});
