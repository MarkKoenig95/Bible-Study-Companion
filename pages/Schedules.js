import React, {useContext, useEffect, useState} from 'react';
import {SafeAreaView, View, FlatList} from 'react-native';

import TextButton from '../components/buttons/TextButton';

import IconButton from '../components/buttons/IconButton';
import CreateSchedulePopup from '../components/popups/CreateSchedulePopup';
import MessagePopup, {useMessagePopup} from '../components/popups/MessagePopup';

import styles from '../styles/styles';

import {store} from '../data/Store/store';
import {setUpdatePages} from '../data/Store/actions';
import {loadData} from '../data/Database/generalTransactions';
import {addSchedule} from '../data/Database/scheduleTransactions';

import {translate} from '../localization/localization';
import LoadingPopup, {useLoadingPopup} from '../components/popups/LoadingPopup';

export default function Schedules(props) {
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {bibleDB, userDB, updatePages} = globalState.state;

  const isCreatingSchedule = props.route.params
    ? props.route.params.isCreatingSchedule
    : false;

  const [flatListItems, setFlatListItems] = useState([]);

  const [
    isCreateSchedulePopupDisplayed,
    setIsCreateSchedulePopupDisplayed,
  ] = useState(isCreatingSchedule);

  const {messagePopup, openMessagePopup, closeMessagePopup} = useMessagePopup();

  const {isLoading, setLoadingPopup} = useLoadingPopup();

  //Set delete button in nav bar with appropriate onPress attribute
  props.navigation.setOptions({
    headerRight: () => (
      <IconButton
        iconOnly
        invertColor
        onPress={() => {
          setIsCreateSchedulePopupDisplayed(!isCreateSchedulePopupDisplayed);
        }}
        name="add"
      />
    ),
  });

  useEffect(() => {
    console.log('updatePages', updatePages);

    loadData(userDB, setFlatListItems, 'tblSchedules');
  }, [userDB, setFlatListItems, updatePages]);

  const afterUpdate = () => {
    dispatch(setUpdatePages(updatePages));
  };

  function onAddSchedule(scheduleName, duration, bookId, chapter, verse) {
    setLoadingPopup(true);
    addSchedule(
      userDB,
      bibleDB,
      scheduleName,
      duration,
      bookId,
      chapter,
      verse,
      () => {
        afterUpdate();
        setIsCreateSchedulePopupDisplayed(false);
        setLoadingPopup(false);
      },
      message => {
        setLoadingPopup(false);
        openMessagePopup(message);
      },
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LoadingPopup displayPopup={isLoading} />
      <MessagePopup
        displayPopup={messagePopup.isDisplayed}
        title={messagePopup.title}
        message={messagePopup.message}
        onClosePress={closeMessagePopup}
      />
      <CreateSchedulePopup
        displayPopup={isCreateSchedulePopupDisplayed}
        onAdd={onAddSchedule}
        onClosePress={() => {
          setIsCreateSchedulePopupDisplayed(false);
        }}
        onError={(message, title) => openMessagePopup(message, title)}
      />
      <View style={styles.content}>
        <FlatList
          data={flatListItems}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <TextButton
              key={item.ScheduleID}
              text={item.ScheduleName}
              onPress={() =>
                navigation.navigate('SchedulePage', {
                  id: item.ScheduleID,
                  title: item.ScheduleName,
                  name: item.ScheduleName,
                })
              }
            />
          )}
        />
        <IconButton
          buttonStyle={{alignSelf: 'center'}}
          onPress={() => {
            setIsCreateSchedulePopupDisplayed(!isCreateSchedulePopupDisplayed);
          }}
          name="add"
        />
      </View>
    </SafeAreaView>
  );
}
