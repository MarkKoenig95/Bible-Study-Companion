import * as React from 'react';

import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import {StateProvider} from './data/Store/store';

import Schedules from './pages/Schedules';
import SchedulePage from './pages/SchedulePage';

import IconButton from './components/buttons/IconButton';

import styles, {colors} from './styles/styles';

const Stack = createStackNavigator();
const navigationOptions = {
  headerStyle: {backgroundColor: colors.lightGray},
  headerTintColor: colors.smoke,
};

function App() {
  return (
    <StateProvider>
      <NavigationContainer>
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
      </NavigationContainer>
    </StateProvider>
  );
}

export default App;
