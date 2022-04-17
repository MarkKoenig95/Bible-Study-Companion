import React from 'react';
import {SafeAreaView, View, FlatList} from 'react-native';
import {translate} from '../../logic/localization/localization';

import MessagePopup from '../../components/popups/MessagePopup';

import styles from '../../styles/styles';

import {log} from '../../data/Database/generalTransactions';
import TextButton from '../../components/buttons/TextButton';
import ScheduleSettingsPopup from '../../components/popups/ScheduleSettingsPopup';
import LoadingPopup from '../../components/popups/LoadingPopup';
import {ReadingItem} from '../../data/Database/types';
import useSchedulePage from './logic';
import {SchedulePageProps} from './types';

let flatListRef: any;

function SchedulePage(props: SchedulePageProps) {
  log('loaded schedule page');

  const {navigation, route} = props;

  const {
    _handleScheduleNameChange,
    _handleSetDoesTrack,
    _handleSetHideCompleted,
    _handleStartDateChange,
    closeMessagePopup,
    completedHidden,
    firstUnfinished,
    getItemLayout,
    initialScrollIndex,
    isLoading,
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
  } = useSchedulePage({navigation, route}, flatListRef);

  return (
    <SafeAreaView testID={pageTitle} style={styles.container}>
      <LoadingPopup
        testID={pageTitle + '.loadingPopup'}
        displayPopup={isLoading}
      />
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
        completedHidden={!!completedHidden}
        displayPopup={settingsPopupIsDisplayed}
        doesTrack={!!shouldTrack}
        onClosePress={toggleSettingsPopupIsDisplayed}
        onScheduleNameChange={_handleScheduleNameChange}
        onSetDoesTrack={_handleSetDoesTrack}
        onSetHideCompleted={_handleSetHideCompleted}
        onStartDateChange={_handleStartDateChange}
        scheduleName={scheduleName}
        startDate={startDate}
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
          ref={(ref) => {
            flatListRef = ref;
          }}
          initialScrollIndex={initialScrollIndex.current}
          getItemLayout={getItemLayout}
          renderItem={({item, index}: {item: ReadingItem[]; index: number}) => {
            let firstUnfinishedID = firstUnfinished
              ? firstUnfinished.ReadingDayID
              : Infinity;
            return setScheduleButtons(item, index, firstUnfinishedID);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

export default SchedulePage;
