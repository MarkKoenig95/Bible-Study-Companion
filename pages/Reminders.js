import React, {useContext, useEffect, useState} from 'react';
import {SafeAreaView, View, StyleSheet, FlatList} from 'react-native';

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

import {translate} from '../logic/localization/localization';
import {
  useUpdate,
  sanitizeNumber,
  createPickerArray,
  ERROR,
} from '../logic/logic';
import {
  FREQS,
  setReminderCompDate,
  addReminder,
  deleteReminder,
} from '../data/Database/reminderTransactions';
import {loadData, updateValue} from '../data/Database/generalTransactions';
import CreateReminderPopup, {
  useCreateReminderPopup,
} from '../components/popups/CreateReminderPopup';

const prefix = 'remindersPage.';

const ReminderWrapper = props => {
  const {
    frequency,
    isFinished,
    itemID,
    name,
    resetValue,
    completionDate,
    onUpdateReminder,
    onUpdateIsFinished,
    onDeleteReminder,
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
  const [completedDesc, setCompletedDesc] = useState('');

  const RECURS = {
    [FREQS.DAILY]: translate('frequencies.daily'),
    [FREQS.WEEKLY]: translate('frequencies.weekly'),
    [FREQS.MONTHLY]: translate('frequencies.monthly'),
  };

  const freqPickerValues = createPickerArray(
    RECURS[FREQS.DAILY],
    RECURS[FREQS.WEEKLY],
    RECURS[FREQS.MONTHLY],
  );

  const recursText = RECURS[freq];

  useEffect(() => {
    switch (freq) {
      case FREQS.DAILY:
        setIsDaily(true);
        setIsWeekly(false);
        setCompletedDesc(translate('today'));
        break;
      case FREQS.WEEKLY:
        setIsDaily(false);
        setIsWeekly(true);
        setResetStr(translate(`weekdays.${resetVal}.name`));
        setCompletedDesc(translate('thisWeek'));
        break;
      case FREQS.MONTHLY:
        setIsDaily(false);
        setIsWeekly(false);
        setResetStr(resetVal.toString());
        setCompletedDesc(translate('thisMonth'));
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
            isEditing={isEditing}
            onDeleteReminder={onDeleteReminder}
            setIsEditing={setIsEditing}
          />
        )}

        <View style={{flex: 6}}>
          <NameSection
            isEditing={isEditing}
            reminderName={reminderName}
            setReminderName={setReminderName}
          />

          <FrequencySection
            isEditing={isEditing}
            freq={freq}
            freqPickerValues={freqPickerValues}
            recursText={recursText}
            setFreq={setFreq}
          />

          {!isDaily && (
            <RecursSection
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
              completedDesc={completedDesc}
              isFinished={isFinished}
              toggleIsFinished={toggleIsFinished}
            />
          ) : (
            <ActionButtonSection
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
  const {onEditCancel, onEditDone} = props;
  return (
    <View style={style.reminderContent}>
      <TextButton onPress={onEditCancel} text={translate('actions.cancel')} />
      <TextButton onPress={onEditDone} text={translate('actions.done')} />
    </View>
  );
};

const AdjButtonSection = props => {
  const {isEditing, onDeleteReminder, setIsEditing} = props;
  return (
    <View style={style.buttonContainer}>
      <IconButton
        buttonStyle={style.editButton}
        iconOnly
        name="edit"
        onPress={() => {
          setIsEditing(!isEditing);
        }}
      />
      <IconButton
        buttonStyle={style.deleteButton}
        iconOnly
        name="delete"
        onPress={onDeleteReminder}
      />
    </View>
  );
};

const IsCompletedSection = props => {
  const {completedDesc, isFinished, toggleIsFinished} = props;
  return (
    <View style={style.reminderContent}>
      <Body dark>{translate(prefix + 'completed', {desc: completedDesc})}</Body>
      <CheckBox checked={isFinished} onPress={toggleIsFinished} />
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
  } = props;

  //If it's not editing we display the text as is
  //If it is editing, then we either show a picker for a weekday or we show a numerical input
  return (
    <View style={style.reminderContent}>
      <Body dark style={{alignSelf: 'center'}}>
        {translate(prefix + 'every')}
      </Body>
      {!isEditing ? (
        <Body dark style={{color: colors.darkBlue}}>
          {resetStr}
        </Body>
      ) : isWeekly ? (
        <WeekdayPicker onChange={setResetVal} currentValue={resetVal} />
      ) : (
        <CustomInput
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
    </View>
  );
};

const FrequencySection = props => {
  let {isEditing, recursText, freq, freqPickerValues, setFreq} = props;
  return (
    <View style={style.reminderContent}>
      <Body dark style={{alignSelf: 'center'}}>
        {translate(prefix + 'repeats')}
      </Body>
      {!isEditing ? (
        <Body dark style={{color: colors.darkBlue}}>
          {recursText}
        </Body>
      ) : (
        <Picker
          onChange={setFreq}
          values={freqPickerValues}
          currentValue={freq}
        />
      )}
    </View>
  );
};

const NameSection = props => {
  let {isEditing, reminderName, setReminderName} = props;
  return (
    <View style={[style.reminderContent, {borderTopWidth: 0}]}>
      <Body dark style={{alignSelf: 'center'}}>
        {translate(prefix + 'name')}
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
  console.log('loaded reminders page');
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {userDB, updatePages} = globalState.state;
  const [listItems, setListItems] = useState([]);

  const {messagePopup, openMessagePopup, closeMessagePopup} = useMessagePopup();
  const {reminderPopup} = useCreateReminderPopup();

  const afterUpdate = useUpdate(updatePages, dispatch);

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

  return (
    <SafeAreaView style={styles.container}>
      <MessagePopup
        displayPopup={messagePopup.isDisplayed}
        title={messagePopup.title}
        message={messagePopup.message}
        onClosePress={closeMessagePopup}
      />
      <CreateReminderPopup
        displayPopup={reminderPopup.isDisplayed}
        onAddReminder={onAddReminder}
        onClosePress={reminderPopup.close}
        title={reminderPopup.title}
        prefix={prefix}
      />
      <View style={styles.contentWithoutHeader}>
        <FlatList
          data={listItems}
          keyExtractor={(item, index) => index + JSON.stringify(item)}
          renderItem={({item}) => {
            return (
              <ReminderWrapper
                itemID={item.ID}
                completionDate={item.CompletionDate}
                name={item.Name}
                isFinished={item.IsFinished}
                frequency={item.Frequency}
                resetValue={item.ResetValue}
                onUpdateReminder={onUpdateReminder}
                onUpdateIsFinished={onUpdateIsFinished}
                onDeleteReminder={() => {
                  deleteReminder(userDB, item.ID).then(() => {
                    afterUpdate();
                  });
                }}
              />
            );
          }}
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
