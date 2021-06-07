import {RouteProp} from '@react-navigation/core';
import {StackNavigationProp} from '@react-navigation/stack';

export type RootStackParamList = {
  Home: undefined;
  Schedules: undefined;
  Schedule: {table: string; name: string};
  Settings: undefined;
  Notifications: undefined;
  Notification: undefined;
  Reminders: undefined;
};

export type ScheduleScreenRouteProp = RouteProp<RootStackParamList, 'Schedule'>;

export type SchedulePageProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Schedule'>;
  route: ScheduleScreenRouteProp;
};
