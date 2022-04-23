import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  MutableRefObject,
} from 'react';
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
  ScheduleType,
  SCHEDULE_TYPES,
} from '../../logic/general';
import useScheduleButtonsList from '../../components/ScheduleButtonsList/useScheduleButtonsList';

import {
  BibleReadingItem,
  DBReadingItem,
  ReadingItem,
} from '../../data/Database/types';
import {SchedulePageProps} from './types';

const pageTitle = 'schedulePage';
const baseItem: DBReadingItem | undefined = undefined;
const baseListItems: ReadingItem[][] = [];
const baseScheduleType: ScheduleType | undefined = undefined;
const baseBooleanState: boolean | undefined = undefined;

function useItemLayout(
  firstUnfinished: DBReadingItem | undefined,
  completedHidden: boolean,
  scheduleType: ScheduleType | undefined,
  initialScrollIndexRef: MutableRefObject<number>,
) {
  const baseReadingInfoRef = {
    currentOffset: 0,
    prevEndBibleBook: 0,
  };

  const layoutData = useRef([{length: 0, offset: 0, index: 0}]);

  const getLayoutData = (data: BibleReadingItem[][]) => {
    const length = 82.33;

    let readingInfo = {...baseReadingInfoRef};
    let layouts = data.map((items: BibleReadingItem[], idx) => {
      let {currentOffset, prevEndBibleBook} = readingInfo;
      let curEndBibleBook = items[0].endBookNumber;
      currentOffset += length;
      let currentLength = length;

      if (
        firstUnfinished &&
        items[0].readingDayID === firstUnfinished.ReadingDayID
      ) {
        initialScrollIndexRef.current = idx;
      }

      if (items.length === 1) {
        readingInfo = {
          currentOffset,
          prevEndBibleBook: curEndBibleBook,
        };

        let result = {
          length: length,
          offset: currentOffset,
          index: idx,
        };

        return result;
      }

      for (let i = 1; i < items.length; i++) {
        const item = items[i];

        if (
          firstUnfinished &&
          item.readingDayID === firstUnfinished.ReadingDayID
        ) {
          initialScrollIndexRef.current = idx;
        }

        let curStartBibleBook = item.startBookNumber;
        curEndBibleBook = item.endBookNumber;

        if (curStartBibleBook === prevEndBibleBook) {
          readingInfo.prevEndBibleBook = curEndBibleBook;
          continue;
        }

        currentOffset += 25.33;
        currentLength += 25.33;

        readingInfo.prevEndBibleBook = curEndBibleBook;
      }

      readingInfo = {
        currentOffset: currentOffset,
        prevEndBibleBook: curEndBibleBook,
      };

      let result = {
        length: currentLength,
        offset: currentOffset,
        index: idx,
      };

      return result;
    });
    return layouts;
  };

  const getItemLayout = (
    data: ReadingItem[][] | null | undefined,
    index: number,
  ) => {
    let length = 82.33;
    let isChrono = scheduleType === SCHEDULE_TYPES.CHRONOLOGICAL;

    if (completedHidden) {
      initialScrollIndexRef.current = 0;
    }

    if (!isChrono) {
      return {
        length: length,
        offset: length * index,
        index,
      };
    }

    const bibleReadingItemData = data as BibleReadingItem[][];

    if (index === 0 && layoutData.current.length < 2) {
      if (data) {
        layoutData.current = getLayoutData(bibleReadingItemData);
      }
    }

    if (layoutData.current[index]) {
      return layoutData.current[index];
    } else {
      return {index, length: 0, offset: 0};
    }
  };

  return getItemLayout;
}

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
  const [scheduleType, setScheduleType] = useState(baseScheduleType);
  const [shouldTrack, setShouldTrack] = useState(baseBooleanState);
  const [startDate, setStartDate] = useState(new Date());
  const [isLoading, setLoadingPopup] = useState(false);
  const [firstUnfinished, setFirstUnfinished] = useState(baseItem);
  const [readingPortionWidth, setReadingPortionWidth] = useState(0);

  const initialScrollIndexRef = useRef(0);

  initialScrollIndexRef.current =
    !completedHidden &&
    scheduleType !== SCHEDULE_TYPES.CHRONOLOGICAL &&
    firstUnfinished
      ? firstUnfinished.ReadingDayID
      : 0;

  const [initialScrollIndex, setInitialScrollIndex] = useState(
    initialScrollIndexRef.current,
  );

  const {messagePopup, openMessagePopup, closeMessagePopup} = useMessagePopup();
  const [settingsPopupIsDisplayed, toggleSettingsPopupIsDisplayed] =
    useToggleState(false);

  const afterUpdate = useUpdate(dispatch);

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

  const getItemLayout = useItemLayout(
    firstUnfinished,
    completedHidden,
    scheduleType,
    initialScrollIndexRef,
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
      if (res) {
        let result = res.rows.item(0) as DBReadingItem;
        setFirstUnfinished(result);
      }
    });
  }, [tableName, userDB, updatePages]);

  useEffect(() => {
    if (
      typeof shouldTrack === 'undefined' ||
      typeof completedHidden === 'undefined'
    ) {
      getScheduleSettings(userDB, scheduleName).then(
        (settings: {
          doesTrack: boolean;
          hideCompleted: boolean;
          scheduleType: ScheduleType;
          startDate: Date;
        }) => {
          const {doesTrack, hideCompleted, scheduleType, startDate} = settings;

          setShouldTrack(doesTrack);
          setCompletedHidden(hideCompleted);
          setScheduleType(scheduleType);
          setStartDate(startDate);
        },
      );
      return;
    }

    loadData(userDB, tableName, shouldTrack, completedHidden).then(
      (res?: any[]) => {
        if (res) {
          setListItems(res);
        }
      },
    );
  }, [
    completedHidden,
    scheduleName,
    shouldTrack,
    tableName,
    userDB,
    updatePages,
  ]);

  useEffect(() => {
    if (
      listItems.length > 0 &&
      flatListRef &&
      firstUnfinished &&
      typeof scheduleType !== 'undefined' &&
      !completedHidden
    ) {
      if (initialScrollIndexRef.current > 0) {
        setInitialScrollIndex(initialScrollIndexRef.current);
      }

      setTimeout(() => {
        flatListRef.scrollToIndex({
          animated: false,
          index: initialScrollIndexRef.current || initialScrollIndex,
          viewOffset: 0,
          viewPosition: 0.2,
        });
      }, 500);
    }
  }, [
    completedHidden,
    firstUnfinished,
    flatListRef,
    initialScrollIndex,
    listItems,
    scheduleType,
  ]);

  return {
    _handleScheduleNameChange,
    _handleSetDoesTrack,
    _handleSetHideCompleted,
    _handleStartDateChange,
    closeMessagePopup,
    completedHidden,
    getItemLayout,
    isLoading,
    firstUnfinished,
    listItems,
    messagePopup,
    openRemindersPopup,
    pageTitle,
    readingPortionWidth,
    settingsPopupIsDisplayed,
    shouldTrack,
    ScheduleListPopups,
    scheduleName,
    setReadingPortionWidth,
    setScheduleButtons,
    startDate,
    toggleSettingsPopupIsDisplayed,
  };
}
