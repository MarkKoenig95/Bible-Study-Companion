import React, {useContext, useEffect, useRef, useState} from 'react';
import {AppState, Platform} from 'react-native';

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import BackgroundFetch from 'react-native-background-fetch';

import {store} from './data/Store/store';
import {
  setFirstRender,
  setUpdatePages,
  setUserDB,
  setBibleDB,
  setNotification,
  setShowDaily,
  setWeeklyReadingResetDay,
} from './data/Store/actions';
import {BibleInfoDB, UserInfoDB} from './data/Database/Database';
import {log, getSettings} from './data/Database/generalTransactions';
import {updateNotifications} from './data/Database/notificationTransactions';
import {updateReminderDates} from './data/Database/reminderTransactions';

import Home from './pages/Home';
import Schedules from './pages/Schedules';
import SchedulePage from './pages/SchedulePage/SchedulePage';
import Notifications from './pages/Notifications';
import Notification from './pages/Notification';
import Reminders from './pages/Reminders';
import Settings from './pages/Settings';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {colors} from './styles/styles';
import {useNotifications} from './logic/notifications/NotifService';

import {useLocalization, translate} from './logic/localization/localization';
import {runQueries} from './logic/scheduleCreation';

const Stack = createStackNavigator();
const navigationOptions = {
  headerStyle: {backgroundColor: colors.lightGray},
  headerTintColor: colors.smoke,
};

const Tabs = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={navigationOptions}>
      <Stack.Screen
        name="Home"
        component={Home}
        options={{title: translate('homePage.title')}}
      />
    </Stack.Navigator>
  );
}

function SchedulesStack() {
  return (
    <Stack.Navigator screenOptions={navigationOptions}>
      <Stack.Screen
        name="Schedules"
        component={Schedules}
        options={{title: translate('readingSchedules')}}
      />
      <Stack.Screen
        name="SchedulePage"
        component={SchedulePage}
        options={({route}) => ({
          title: route.params.name,
        })}
      />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={navigationOptions}>
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{title: translate('settingsPage.title')}}
      />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{title: translate('notificationsPage.title')}}
      />
      <Stack.Screen
        name="Notification"
        component={Notification}
        options={({route}) => ({
          title: route.params.name,
        })}
      />

      <Stack.Screen
        name="Reminders"
        component={Reminders}
        options={{title: translate('remindersPage.title')}}
      />
    </Stack.Navigator>
  );
}

async function initializeData() {
  log('Initializing Databases');
  const bibleDB = await BibleInfoDB.getConnection();
  const userDB = await UserInfoDB.getConnection();

  const data = {
    bibleDB: bibleDB,
    userDB: userDB,
  };

  return data;
}

function backgroundRefreh(userDB, notification) {
  log('Configuring background refresh');
  BackgroundFetch.configure(
    {
      enableHeadless: false,
      minimumFetchInterval: 15, // minutes
      stopOnTerminate: false,
      startOnBoot: true,
    },
    async (event) => {
      let taskID = event.taskId;
      console.log('Received background fetch event');
      userDB = userDB || (await UserInfoDB.getConnection());

      updateNotifications(userDB, notification);

      BackgroundFetch.finish(taskID);
    },
    (error) => {
      console.log('Background fetch failed to start with error: ' + error);
    },
  );
}

export default function AppContainer() {
  const globalState = useContext(store);

  log('App container loaded');

  const {dispatch} = globalState;
  const {isFirstRender, updatePages, userDB} = globalState.state;

  const labelMarginTop = Platform.OS === 'ios' ? 0 : -20;
  const tabPaddingBottom = Platform.OS === 'ios' ? 0 : 20;

  const {notification} = useNotifications();

  useEffect(() => {
    initializeData().then((data) => {
      log('Setting context values');
      dispatch(setUserDB(data.userDB));
      dispatch(setBibleDB(data.bibleDB));
      dispatch(setNotification(notification));
      backgroundRefreh(data.userDB, notification);
      runQueries(data.bibleDB);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  const [refresh, setRefresh] = useState(updatePages);

  useEffect(() => {
    AppState.addEventListener('change', _handleAppStateChange);

    return () => {
      AppState.removeEventListener('change', _handleAppStateChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //Fixes bug with app state change update
  useEffect(() => {
    if (updatePages !== refresh) {
      dispatch(setUpdatePages(refresh));
    }
  }, [dispatch, updatePages, refresh]);

  useEffect(() => {
    setRefresh((prev) => {
      return prev + 1;
    });
    if (isFirstRender) {
      dispatch(setFirstRender(false));
      dispatch(setUpdatePages(0));
    }
    if (userDB) {
      updateNotifications(userDB, notification);
      updateReminderDates(userDB);
      getSettings(userDB).then((settings) => {
        let {showDaily, weeklyReadingResetDay} = settings;

        dispatch(setShowDaily(showDaily));
        dispatch(setWeeklyReadingResetDay(weeklyReadingResetDay));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isFirstRender, setRefresh, updatePages, userDB]);

  const _handleAppStateChange = (nextAppState) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      dispatch(setUpdatePages(updatePages));
    }

    appState.current = nextAppState;
    setAppStateVisible(appState.current);
  };

  useLocalization();

  return (
    <NavigationContainer>
      <Tabs.Navigator
        tabBarOptions={{
          activeTintColor: colors.darkBlue,
          inactiveTintColor: colors.smoke,
          labelStyle: {fontSize: 13, marginTop: labelMarginTop},
          keyboardHidesTabBar: true,
          tabStyle: {
            paddingBottom: tabPaddingBottom,
          },
          style: {backgroundColor: colors.lightGray, height: 100},
        }}>
        <Tabs.Screen
          name="HomeStack"
          component={HomeStack}
          options={{
            tabBarTestID: 'tabs.homePage',
            tabBarLabel: translate('homePage.title'),
            tabBarIcon: ({color, size}) => (
              <Icon
                style={{marginTop: 5}}
                color={color}
                name="home"
                size={size * 1.3}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="SchedulesStack"
          component={SchedulesStack}
          options={{
            tabBarTestID: 'tabs.schedulesPage',
            tabBarLabel: translate('schedules'),
            tabBarIcon: ({color, size}) => (
              <Icon
                style={{marginTop: 5}}
                color={color}
                name="event-note"
                size={size * 1.3}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="SettingsStack"
          component={SettingsStack}
          options={{
            tabBarTestID: 'tabs.settingsPage',
            tabBarLabel: translate('settingsPage.title'),
            tabBarIcon: ({color, size}) => (
              <Icon
                style={{marginTop: 5}}
                color={color}
                name="settings"
                size={size * 1.3}
              />
            ),
          }}
        />
      </Tabs.Navigator>
    </NavigationContainer>
  );
}
