import React, {useContext, useState, useEffect, useCallback} from 'react';
import {SafeAreaView, View, FlatList} from 'react-native';
import {StackActions} from '@react-navigation/native';
import {translate} from '../logic/localization/localization';

import MessagePopup, {useMessagePopup} from '../components/popups/MessagePopup';
import IconButton from '../components/buttons/IconButton';

import styles from '../styles/styles';

import {store} from '../data/Store/store.js';
import {loadData} from '../data/Database/generalTransactions';
import {
  deleteSchedule,
  setHideCompleted,
  getScheduleSettings,
  renameSchedule,
  setDoesTrack,
} from '../data/Database/scheduleTransactions';
import TextButton from '../components/buttons/TextButton';
import {
  WEEKLY_READING_TABLE_NAME,
  useUpdate,
  useToggleState,
} from '../logic/general';
import useScheduleButtonsList from '../components/ScheduleButtonsList';
import ScheduleSettingsPopup from '../components/popups/ScheduleSettingsPopup';

const pageTitle = 'schedulePage';
let flatListRef;
let settingFirstUnfinished = false;

function SchedulePage(props) {
  console.log('loaded schedule page');

  const {navigation, route} = props;

  const globalState = useContext(store);
  const {dispatch} = globalState;
  const {userDB, updatePages} = globalState.state;

  const scheduleName = route.params.name;
  const tableName = route.params.table;

  const [listItems, setListItems] = useState([]);

  const [completedHidden, setCompletedHidden] = useState();
  const [shouldTrack, setShouldTrack] = useState();

  const [firstUnfinished, setFirstUnfinished] = useState();

  const {messagePopup, openMessagePopup, closeMessagePopup} = useMessagePopup();
  const [
    settingsPopupIsDisplayed,
    toggleSettingsPopupIsDisplayed,
  ] = useToggleState(false);

  const afterUpdate = useUpdate(updatePages, dispatch);

  const {
    ScheduleListPopups,
    setScheduleButtons,
    openRemindersPopup,
  } = useScheduleButtonsList(
    userDB,
    afterUpdate,
    completedHidden,
    updatePages,
    tableName,
    scheduleName,
    pageTitle,
  );

  //Set delete button in nav bar with appropriate onPress attribute
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        if (tableName !== WEEKLY_READING_TABLE_NAME) {
          return (
            <View
              testID={pageTitle + '.header'}
              style={styles.navHeaderContainer}>
              <IconButton
                testID={pageTitle + '.header.deleteButton'}
                buttonStyle={styles.navHeaderButton}
                iconOnly
                invertColor
                onPress={() => {
                  let title = translate('warning');
                  let message = translate(
                    'schedulePage.deleteScheduleMessage',
                    {
                      scheduleName: scheduleName,
                    },
                  );
                  let onConfirm = _handleDeleteSchedule;

                  openMessagePopup(message, title, onConfirm);
                }}
                name="delete"
              />
              <IconButton
                testID={pageTitle + '.header.settingsButton'}
                buttonStyle={styles.navHeaderButton}
                iconOnly
                invertColor
                onPress={toggleSettingsPopupIsDisplayed}
                name="settings"
              />
            </View>
          );
        }
      },
    });

    settingFirstUnfinished = false;
  }, [
    _handleDeleteSchedule,
    openMessagePopup,
    navigation,
    scheduleName,
    tableName,
    toggleSettingsPopupIsDisplayed,
  ]);

  useEffect(() => {
    if (
      typeof shouldTrack === 'undefined' ||
      typeof completedHidden === 'undefined'
    ) {
      getScheduleSettings(userDB, scheduleName).then(settings => {
        const {doesTrack, hideCompleted} = settings;

        setShouldTrack(doesTrack);
        setCompletedHidden(hideCompleted);
      });
      return;
    }

    loadData(userDB, tableName, shouldTrack).then(res => {
      if (res) {
        setListItems(res);
      }
    });
  }, [
    completedHidden,
    scheduleName,
    shouldTrack,
    tableName,
    userDB,
    updatePages,
  ]);

  useEffect(() => {
    if (listItems.length > 0 && flatListRef && completedHidden) {
      setFirstUnfinished();
      settingFirstUnfinished = false;
      flatListRef.scrollToIndex({
        animated: false,
        index: 0,
        viewPosition: 0,
      });
    }

    if (listItems.length > 0 && flatListRef && firstUnfinished) {
      console.log('firstUnfinished', firstUnfinished);
      flatListRef.scrollToItem({
        animated: false,
        item: firstUnfinished,
        viewPosition: 0,
      });
    }
  }, [completedHidden, firstUnfinished, listItems]);

  const _handleScheduleNameChange = useCallback(
    newScheduleName => {
      renameSchedule(userDB, scheduleName, newScheduleName).then(afterUpdate);
    },
    [userDB, scheduleName, afterUpdate],
  );

  const _handleSetHideCompleted = useCallback(() => {
    setHideCompleted(userDB, scheduleName, !completedHidden).then(afterUpdate);
    setCompletedHidden(!completedHidden);
  }, [afterUpdate, completedHidden, scheduleName, userDB]);

  const _handleSetDoesTrack = useCallback(() => {
    setDoesTrack(userDB, scheduleName, !shouldTrack).then(afterUpdate);
    setShouldTrack(!shouldTrack);
  }, [afterUpdate, shouldTrack, scheduleName, userDB]);

  const _handleDeleteSchedule = useCallback(() => {
    navigation.dispatch(StackActions.pop(1));
    //Wait a little while to delete the schedule so that we pop this page from the stack
    //before it tries to render a nonexistant schedule
    setTimeout(() => {
      deleteSchedule(userDB, tableName, scheduleName).then(() => {
        afterUpdate();
      });
    }, 750);
  }, [afterUpdate, navigation, scheduleName, tableName, userDB]);

  return (
    <SafeAreaView testID={pageTitle} style={styles.container}>
      <MessagePopup
        testID={pageTitle + '.messagePopup'}
        displayPopup={messagePopup.isDisplayed}
        title={messagePopup.title}
        message={messagePopup.message}
        onClosePress={closeMessagePopup}
        onConfirm={messagePopup.onConfirm}
      />
      <ScheduleSettingsPopup
        testID={pageTitle + '.settingsPopup'}
        completedHidden={completedHidden}
        displayPopup={settingsPopupIsDisplayed}
        doesTrack={shouldTrack}
        onClosePress={toggleSettingsPopupIsDisplayed}
        onScheduleNameChange={_handleScheduleNameChange}
        onSetDoesTrack={_handleSetDoesTrack}
        onSetHideCompleted={_handleSetHideCompleted}
        scheduleName={scheduleName}
        title={translate('settingsPage.title')}
      />
      <ScheduleListPopups />
      <View style={styles.header}>
        <TextButton
          testID={pageTitle + '.readingRemindersButton'}
          text={translate('readingRemindersPopup.readingReminders')}
          onPress={openRemindersPopup}
        />
      </View>
      <View style={styles.content}>
        <FlatList
          testID={pageTitle + '.buttonList'}
          data={listItems}
          keyExtractor={(item, index) => index.toString()}
          ref={ref => {
            flatListRef = ref;
          }}
          getItemLayout={(data, index) => ({
            length: 85,
            offset: 85 * index,
            index,
          })}
          renderItem={({item, index}) => {
            if (
              !settingFirstUnfinished &&
              !completedHidden &&
              !firstUnfinished &&
              !item[0].IsFinished
            ) {
              settingFirstUnfinished = true;
              setFirstUnfinished(item);
            }
            return setScheduleButtons(item, index);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

export default SchedulePage;
