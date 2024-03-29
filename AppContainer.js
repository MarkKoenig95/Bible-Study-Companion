import React, {useContext, useEffect, useRef, useState} from 'react';
import {AppState, Platform} from 'react-native';

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import BackgroundFetch from 'react-native-background-fetch';

import {store} from './data/Store/store';
import {
  setLanguageInfo,
  setFirstRender,
  setUpdatePages,
  setUserDB,
  setBibleDB,
  setNotification,
  setShowDaily,
  setWeeklyReadingResetDay,
  incrementUpdatePages,
  setMemorialScheduleType,
} from './data/Store/actions';
import {BibleInfoDB, UserInfoDB} from './data/Database/Database';
import {log, getSettings, runSQL} from './data/Database/generalTransactions';
import {updateNotifications} from './data/Database/notificationTransactions';
import {updateReminderDates} from './data/Database/reminderTransactions';

import Home from './pages/Home';
import Schedules from './pages/Schedules';
import SchedulePage from './pages/SchedulePage/SchedulePage';
import Notifications from './pages/Notifications';
import Notification from './pages/Notification';
import Reminders from './pages/Reminders';
import More from './pages/More';
import Settings from './pages/Settings';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {colors} from './styles/styles';
import {useNotifications} from './logic/notifications/NotifService';

import {translate} from './logic/localization/localization';
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
      <Stack.Screen name="Home" component={Home} options={{title: 'Home'}} />
    </Stack.Navigator>
  );
}

function SchedulesStack() {
  return (
    <Stack.Navigator screenOptions={navigationOptions}>
      <Stack.Screen
        name="Schedules"
        component={Schedules}
        options={{title: 'Reading Schedules'}}
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

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={navigationOptions}>
      <Stack.Screen name="More" component={More} options={{title: 'More'}} />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{title: 'Notifications'}}
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
        options={{title: 'Reminders'}}
      />
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{title: 'Settings'}}
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
      let {bibleDB, userDB} = data;
      log('Setting context values');
      dispatch(setUserDB(userDB));
      dispatch(setBibleDB(bibleDB));
      dispatch(setNotification(notification));
      backgroundRefreh(userDB, notification);
      runQueries(bibleDB);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appState = useRef(AppState.currentState);
  const [, setAppStateVisible] = useState(appState.current);

  useEffect(() => {
    let listener = AppState.addEventListener('change', _handleAppStateChange);

    return () => {
      listener.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstRender) {
      dispatch(setFirstRender(false));
      dispatch(setUpdatePages(0));
    }
    if (userDB) {
      runSQL(
        userDB,
        'SELECT Description FROM tblUserPrefs WHERE Name="LanguageInfo";',
      ).then((res) => {
        let languageInfo = res.rows.item(0).Description;
        if (languageInfo) {
          languageInfo = JSON.parse(languageInfo);
        }
        dispatch(setLanguageInfo(languageInfo));
      });
      updateNotifications(userDB, notification);
      updateReminderDates(userDB);
      getSettings(userDB).then((settings) => {
        let {showDaily, memorialScheduleType, weeklyReadingResetDay} = settings;

        dispatch(setShowDaily(showDaily));
        dispatch(setWeeklyReadingResetDay(weeklyReadingResetDay));
        dispatch(setMemorialScheduleType(memorialScheduleType));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirstRender, updatePages, userDB]);

  const _handleAppStateChange = (nextAppState) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log('setting update pages');
      dispatch(incrementUpdatePages());
    }

    appState.current = nextAppState;
    setAppStateVisible(appState.current);
  };

  return (
    <NavigationContainer>
      <Tabs.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.darkBlue,
          tabBarInactiveTintColor: colors.smoke,
          tabBarlabelStyle: {fontSize: 13, marginTop: labelMarginTop},
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            height: 90,
            backgroundColor: colors.lightGray,
            paddingBottom: tabPaddingBottom,
            paddingBottom: 20,
          },
          headerShown: false,
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
          name="MoreStack"
          component={MoreStack}
          options={{
            tabBarTestID: 'tabs.morePage',
            tabBarLabel: translate('morePage.title'),
            tabBarIcon: ({color, size}) => (
              <Icon
                style={{marginTop: 5}}
                color={color}
                name="more-horiz"
                size={size * 1.3}
              />
            ),
          }}
        />
      </Tabs.Navigator>
    </NavigationContainer>
  );
}
