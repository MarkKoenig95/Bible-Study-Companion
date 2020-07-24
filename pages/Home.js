import React, {useCallback, useContext, useEffect, useState} from 'react';
import {SafeAreaView, View, FlatList, Linking} from 'react-native';

import IconButton from '../components/buttons/IconButton';
import TextButton from '../components/buttons/TextButton';
import ScheduleDayButton from '../components/buttons/ScheduleDayButton';
import Text, {Heading, SubHeading} from '../components/text/Text';
import MessagePopup from '../components/popups/MessagePopup';
import ReadingInfoPopup, {
  useReadingInfoPopup,
} from '../components/popups/ReadingInfoPopup';
import ButtonsPopup, {
  useButtonsPopup,
} from '../components/popups/SelectedDayButtonsPopup';
import ReadingRemindersPopup from '../components/popups/ReadingRemindersPopup';

import styles from '../styles/styles';

import {translate, linkFormulator} from '../localization/localization';

import {store} from '../data/Store/store.js';
import {setFirstRender, setUpdatePages} from '../data/Store/actions';

import {
  openTable,
  getVersion,
  log,
  formatDate,
  errorCB,
  getQuery,
} from '../data/Database/generalTransactions';
import {
  formatScheduleTableName,
  updateReadStatus,
  updateDailyText,
} from '../data/Database/scheduleTransactions';
import {useOpenPopupFunction, arraysMatch} from '../logic/logic';

const prefix = 'homePage.';

async function populateHomeList(
  userDB,
  setState,
  openReadingPopup,
  afterUpdate,
) {
  let result;
  let homeListItems = [];
  let date = new Date();
  let todayFormatted = formatDate(date);
  let today = Date.parse(todayFormatted);

  //Populate Daily text
  await userDB
    .transaction(txn => {
      txn
        .executeSql('SELECT * FROM tblDates WHERE Name="DailyText"')
        .then(([t, res]) => {
          let storedDate = Date.parse(res.rows.item(0).Date);

          if (storedDate < today) {
            let readingPortion = translate('dailyText');
            let completionDate = todayFormatted;
            let isFinished = false;
            let onLongPress = cb => {
              updateDailyText(userDB, todayFormatted, afterUpdate);
              cb(true);
            };
            let onPress = () => {
              Linking.openURL(linkFormulator('wol'));
            };

            homeListItems.push([
              {
                completionDate: completionDate,
                isFinished: isFinished,
                onLongPress: onLongPress,
                onPress: onPress,
                readingDayID: 0,
                readingPortion: readingPortion,
                title: null,
              },
            ]);
          }
        });
    })
    .catch(err => {
      errorCB(err);
    });

  //Get the user's list of reading schedules
  await userDB
    .transaction(txn => {
      let sql = 'SELECT * FROM tblSchedules';
      txn.executeSql(sql, []).then(([t, res]) => {
        result = res;
      });
    })
    .catch(err => {
      errorCB(err);
    });

  //Loop through the list and select the first reading portion that is not completed
  for (let i = 0; i < result.rows.length; i++) {
    const id = result.rows.item(i).ScheduleID;
    const scheduleName = result.rows.item(i).ScheduleName;
    const tableName = formatScheduleTableName(id);

    let items;
    let completionDate;

    //Populate reading portions from all schedules for today
    await userDB
      .transaction(txn => {
        const sql = `SELECT * FROM ${tableName}
                  WHERE IsFinished=0
                  ORDER BY ReadingDayID ASC
                  LIMIT 1`;
        txn.executeSql(sql, []).then(([txn, res]) => {
          completionDate = res.rows.item(0).CompletionDate;
        });
      })
      .catch(err => {
        errorCB(err);
      });

    await userDB
      .transaction(txn => {
        const sql = `SELECT * FROM ${tableName}
                  WHERE CompletionDate=?
                  ORDER BY ReadingDayID ASC`;
        txn.executeSql(sql, [completionDate]).then(([txn, res]) => {
          items = res.rows;
        });
      })
      .catch(err => {
        errorCB(err);
      });

    let innerHomeListItems = [];

    for (let j = 0; j < items.length; j++) {
      const item = items.item(j);

      if (Date.parse(item.CompletionDate) <= today) {
        const readingDayID = item.ReadingDayID;
        const readingPortion = item.ReadingPortion;
        const completionDate = item.CompletionDate;
        const isFinished = item.IsFinished;
        const onLongPress = cb => {
          onUpdateReadStatus(
            userDB,
            cb,
            item.IsFinished,
            item.ReadingDayID,
            tableName,
            afterUpdate,
          );
        };

        let onPress = null;

        if (item.StartBookNumber) {
          onPress = cb => {
            openReadingPopup(
              item.StartBookNumber,
              item.StartChapter,
              item.StartVerse,
              item.EndBookNumber,
              item.EndChapter,
              item.EndVerse,
              item.ReadingPortion,
              item.IsFinished,
              item.ReadingDayID,
              cb,
              tableName,
            );
          };
        } else {
          onPress = onLongPress;
        }

        //Add reading portion info to the list
        innerHomeListItems.push({
          completionDate: completionDate,
          isFinished: isFinished,
          onLongPress: onLongPress,
          onPress: onPress,
          readingDayID: readingDayID,
          readingPortion: readingPortion,
          title: scheduleName,
          tableName: tableName,
        });
      }
    }
    if (innerHomeListItems.length > 0) {
      homeListItems.push(innerHomeListItems);
    }
  }

  setState(homeListItems);
}

function onUpdateReadStatus(
  userDB,
  cb,
  status,
  readingDayID,
  tableName,
  afterUpdate,
) {
  updateReadStatus(userDB, tableName, readingDayID, !status, afterUpdate);
  cb(!status);
}

function ScheduleButton(props) {
  const {item, completedHidden, update} = props;

  return (
    <ScheduleDayButton
      key={item.readingDayID}
      isFinished={item.isFinished ? true : false}
      completionDate={item.completionDate}
      completedHidden={completedHidden}
      onLongPress={item.onLongPress}
      onPress={item.onPress}
      readingPortion={item.readingPortion}
      title={item.title}
      update={update}
    />
  );
}

export default function Home(props) {
  console.log('loaded home page');
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {userDB, updatePages} = globalState.state;

  const [flatListItems, setFlatListItems] = useState([]);

  const {
    readingPopup,
    openReadingInfoPopup,
    closeReadingPopup,
  } = useReadingInfoPopup();

  const {
    buttonsPopup,
    openButtonsPopupBase,
    closeButtonsPopup,
  } = useButtonsPopup();

  const [isRemindersPopupDisplayed, setIsRemindersPopupDisplayed] = useState(
    false,
  );

  const closePopupFunctions = [
    closeReadingPopup,
    setIsRemindersPopupDisplayed,
    closeButtonsPopup,
  ];

  const openReadingPopup = useOpenPopupFunction(
    openReadingInfoPopup,
    closePopupFunctions,
  );

  const openButtonsPopup = useOpenPopupFunction(
    openButtonsPopupBase,
    closePopupFunctions,
  );

  const openRemindersPopup = useOpenPopupFunction(
    setIsRemindersPopupDisplayed,
    closePopupFunctions,
  );

  useEffect(() => {
    if (userDB) {
      populateHomeList(userDB, setFlatListItems, openReadingPopup, afterUpdate);
    }
  }, [userDB, openReadingPopup, dispatch, updatePages, afterUpdate]);

  const afterUpdate = useCallback(() => {
    dispatch(setUpdatePages(updatePages));
  }, [dispatch, updatePages]);

  let isFlatListEmpty = flatListItems.length === 0 ? true : false;

  const setScheduleButtons = useCallback(
    (items, index) => {
      let result;
      let completedHidden = true;
      if (items.length === 1) {
        result = (
          <ScheduleButton
            item={items[0]}
            completedHidden={completedHidden}
            update={updatePages}
          />
        );
      } else {
        let buttons = [];
        let areButtonsFinished = [];
        let readingDayIDs = [];
        let readingPortions;
        let completionDate;
        let isFinished;
        let tableName;
        let title;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          let tempIsFinished = item.IsFinished ? true : false;
          if (readingPortions) {
            readingPortions += '\r\n' + item.readingPortion;
          } else {
            readingPortions = item.readingPortion;
            completionDate = item.completionDate;
            isFinished = tempIsFinished;
            tableName = item.tableName;
            title = item.title;
          }
          readingDayIDs.push(item.readingDayID);

          isFinished = tempIsFinished && isFinished;

          areButtonsFinished.push(tempIsFinished);
          buttons.push(
            <ScheduleButton
              key={Math.random() * 10000 + 'w'}
              item={item}
              completedHidden={completedHidden}
              update={updatePages}
            />,
          );
        }

        if (
          buttonsPopup.id === index &&
          buttonsPopup.isDisplayed &&
          !arraysMatch(areButtonsFinished, buttonsPopup.areButtonsFinished)
        ) {
          openButtonsPopupBase(index, buttons, areButtonsFinished);
        }

        result = (
          <ScheduleDayButton
            readingPortion={readingPortions}
            completionDate={completionDate}
            completedHidden={completedHidden}
            isFinished={isFinished}
            title={title}
            update={updatePages}
            onLongPress={cb => {
              for (let i = 0; i < readingDayIDs.length; i++) {
                onUpdateReadStatus(
                  userDB,
                  cb,
                  isFinished,
                  readingDayIDs[i],
                  tableName,
                  afterUpdate,
                );
              }
            }}
            onPress={() => {
              openButtonsPopup(index, buttons, areButtonsFinished);
            }}
          />
        );
      }
      return result;
    },
    [
      userDB,
      afterUpdate,
      updatePages,
      buttonsPopup,
      openButtonsPopup,
      openButtonsPopupBase,
    ],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ReadingInfoPopup
        popupProps={{
          displayPopup: readingPopup.isDisplayed,
          title: readingPopup.title,
          message: readingPopup.message,
          onClosePress: closeReadingPopup,
        }}
        onConfirm={() => {
          onUpdateReadStatus(
            userDB,
            readingPopup.cb,
            readingPopup.isFinished,
            readingPopup.readingDayID,
            readingPopup.tableName,
            afterUpdate,
          );
          closeReadingPopup();
        }}
        startBookNumber={readingPopup.startBookNumber}
        startChapter={readingPopup.startChapter}
        startVerse={readingPopup.startVerse}
        endBookNumber={readingPopup.endBookNumber}
        endChapter={readingPopup.endChapter}
        endVerse={readingPopup.endVerse}
        readingPortion={readingPopup.readingPortion}
      />
      <ButtonsPopup
        displayPopup={buttonsPopup.isDisplayed}
        buttons={buttonsPopup.buttons}
        onClosePress={closeButtonsPopup}
      />
      <ReadingRemindersPopup
        displayPopup={isRemindersPopupDisplayed}
        onClosePress={() => {
          setIsRemindersPopupDisplayed(false);
        }}
      />
      <View style={styles.header}>
        <TextButton
          buttonStyle={{width: '90%'}}
          text={translate('readingRemindersPopup.readingReminders')}
          onPress={() => {
            openRemindersPopup(true);
          }}
        />
      </View>
      <View style={styles.content}>
        <Heading style={{...styles.buttonText, alignSelf: 'center'}}>
          {translate('today')}
        </Heading>
        {!isFlatListEmpty ? (
          <FlatList
            data={flatListItems}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item, index}) => {
              return setScheduleButtons(item, index);
            }}
          />
        ) : (
          <View>
            <SubHeading style={{...styles.buttonText, alignSelf: 'center'}}>
              {translate(prefix + 'emptyList')}
            </SubHeading>
            <IconButton
              buttonStyle={{alignSelf: 'center'}}
              onPress={() => {
                navigation.navigate('SchedulesStack', {
                  screen: 'Schedules',
                  params: {
                    isCreatingSchedule: true,
                  },
                });
              }}
              name="add"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
