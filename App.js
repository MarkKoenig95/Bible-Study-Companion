import * as React from 'react';

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import {StateProvider} from './data/Store/store';

import {useLocalization, translate} from './localization/localization';

import Home from './pages/Home';
import Schedules from './pages/Schedules';
import SchedulePage from './pages/SchedulePage';
import Icon from 'react-native-vector-icons/MaterialIcons';

import styles, {colors} from './styles/styles';

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
        options={{title: translate('home')}}
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

export default function App() {
  useLocalization();
  return (
    <StateProvider>
      <NavigationContainer>
        <Tabs.Navigator
          tabBarOptions={{
            activeTintColor: colors.darkBlue,
            inactiveTintColor: colors.smoke,
            labelStyle: {fontSize: 13},
            style: {backgroundColor: colors.lightGray, height: 100},
          }}>
          <Tabs.Screen
            name="HomeStack"
            component={HomeStack}
            options={{
              tabBarLabel: translate('home'),
              tabBarIcon: ({color, size}) => (
                <Icon
                  style={{marginTop: 10}}
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
              tabBarLabel: translate('schedules'),
              tabBarIcon: ({color, size}) => (
                <Icon
                  style={{marginTop: 10}}
                  color={color}
                  name="list"
                  size={size * 1.5}
                />
              ),
            }}
          />
        </Tabs.Navigator>
      </NavigationContainer>
    </StateProvider>
  );
}
