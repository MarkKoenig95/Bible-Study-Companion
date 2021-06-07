import React, {useContext, useState, useEffect, useCallback} from 'react';
import {Alert, View} from 'react-native';
import {translate} from '../../logic/localization/localization';

import {useMessagePopup} from '../../components/popups/MessagePopup';
import IconButton from '../../components/buttons/IconButton';

import styles from '../../styles/styles';

import {store} from '../../data/Store/store';
import {loadData, runSQL} from '../../data/Database/generalTransactions';
import {
  deleteSchedule,
  setHideCompleted,
  getScheduleSettings,
  renameSchedule,
  setDoesTrack,
  updateScheduleStartDate,
} from '../../data/Database/scheduleTransactions';
import {
  WEEKLY_READING_TABLE_NAME,
  useUpdate,
  useToggleState,
  pageBack,
} from '../../logic/general';
import useScheduleButtonsList from '../../components/ScheduleButtonsList';

import {ReadingScheduleItem} from '../../data/Database/types';
import {SchedulePageProps} from './types';

const pageTitle = 'schedulePage';
const baseItem: ReadingScheduleItem | undefined = undefined;
const baseListItems: ReadingScheduleItem[][] = [];

export default function useSchedulePage(
  props: SchedulePageProps,
  flatListRef: any,
) {
  const {navigation, route} = props;

  const globalState = useContext(store);
  const {dispatch} = globalState;
  const {bibleDB, userDB, updatePages} = globalState.state;

  const scheduleName = route.params.name;
  const tableName = route.params.table;

  const [listItems, setListItems] = useState(baseListItems);
  const [completedHidden, setCompletedHidden] = useState(false);
  const [shouldTrack, setShouldTrack] = useState(true);
  const [startDate, setStartDate] = useState(new Date());
  const [isLoading, setLoadingPopup] = useState(false);
  const [firstUnfinished, setFirstUnfinished] = useState(baseItem);

  const {messagePopup, openMessagePopup, closeMessagePopup} = useMessagePopup();
  const [settingsPopupIsDisplayed, toggleSettingsPopupIsDisplayed] =
    useToggleState(false);

  const afterUpdate = useUpdate(updatePages, dispatch);

  const {ScheduleListPopups, setScheduleButtons, openRemindersPopup} =
    useScheduleButtonsList(
      userDB,
      afterUpdate,
      completedHidden,
      updatePages,
      tableName,
      scheduleName,
      pageTitle,
    );

  const _handleScheduleNameChange = useCallback(
    (newScheduleName) => {
      renameSchedule(userDB, scheduleName, newScheduleName).then(() => {
        afterUpdate();
        pageBack(navigation);
      });
    },
    [navigation, userDB, scheduleName, afterUpdate],
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
    pageBack(navigation);
    //Wait a little while to delete the schedule so that we pop this page from the stack
    //before it tries to render a nonexistant schedule
    //(in the past this caused an error that made it impossible for some to delete schedules)
    setTimeout(() => {
      deleteSchedule(userDB, tableName, scheduleName).then(afterUpdate);
    }, 750);
  }, [afterUpdate, navigation, scheduleName, tableName, userDB]);

  const _handleStartDateChange = useCallback(
    (newStartDate) => {
      openMessagePopup(
        translate('schedulePage.recreateScheduleWarning'),
        translate('warning'),
        () => {
          setLoadingPopup(true);
          updateScheduleStartDate(
            userDB,
            bibleDB,
            scheduleName,
            newStartDate,
          ).then(() => {
            afterUpdate();
            pageBack(navigation);

            Alert.alert(
              translate('prompts.scheduleRecreatedTitle'),
              translate('prompts.scheduleRecreatedMessage'),
            );
          });
        },
      );
    },
    [afterUpdate, bibleDB, navigation, openMessagePopup, scheduleName, userDB],
  );

  //Set delete and settings buttons in nav bar with appropriate onPress attributes
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
  }, [
    _handleDeleteSchedule,
    openMessagePopup,
    navigation,
    scheduleName,
    tableName,
    toggleSettingsPopupIsDisplayed,
  ]);

  useEffect(() => {
    runSQL(
      userDB,
      `SELECT * FROM ${tableName} WHERE IsFinished=0 LIMIT 1;`,
    ).then((res) => {
      setFirstUnfinished(res.rows.item(0));
    });
  }, [tableName, userDB, updatePages]);

  useEffect(() => {
    if (
      typeof shouldTrack === 'undefined' ||
      typeof completedHidden === 'undefined'
    ) {
      getScheduleSettings(userDB, scheduleName).then(
        (settings: {
          startDate: Date;
          doesTrack: boolean;
          hideCompleted: boolean;
        }) => {
          const {startDate, doesTrack, hideCompleted} = settings;

          setShouldTrack(doesTrack);
          setCompletedHidden(hideCompleted);
          setStartDate(startDate);
        },
      );
      return;
    }

    loadData(userDB, tableName, shouldTrack).then((res?: any[]) => {
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
    if (listItems.length > 0 && flatListRef && firstUnfinished) {
      flatListRef.scrollToItem({
        animated: false,
        item: firstUnfinished,
        viewPosition: 0,
      });
    }
  }, [completedHidden, firstUnfinished, flatListRef, listItems]);

  return {
    _handleScheduleNameChange,
    _handleSetDoesTrack,
    _handleSetHideCompleted,
    _handleStartDateChange,
    closeMessagePopup,
    completedHidden,
    isLoading,
    firstUnfinished,
    listItems,
    messagePopup,
    openRemindersPopup,
    pageTitle,
    settingsPopupIsDisplayed,
    shouldTrack,
    ScheduleListPopups,
    scheduleName,
    setScheduleButtons,
    startDate,
    toggleSettingsPopupIsDisplayed,
  };
}
