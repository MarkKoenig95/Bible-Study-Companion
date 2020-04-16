import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Home from './pages/Home';
import SchedulePage from './pages/SchedulePage';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen
          name="SchedulePage"
          component={SchedulePage}
          options={{title: 'Schedule'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
