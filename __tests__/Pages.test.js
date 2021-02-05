/**
 * @format
 */

import 'react-native';
import React from 'react';
import Home from '../pages/Home';
import Schedules from '../pages/Schedules';
import SchedulePage from '../pages/SchedulePage';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';
import {StateProvider} from '../data/Store/store';

jest.mock('../data/Store/store');

const navigation = {dispatch: jest.fn(), setOptions: jest.fn()};
const route = {params: {name: 'A', table: 'tblA'}};

describe('testing if pages render', () => {
  it('renders Home page correctly', async () => {
    await act(async () => {
      renderer.create(
        <StateProvider>
          <Home navigation={navigation} route={route} />
        </StateProvider>,
      );
    });
  });
  it('renders Schedules page correctly', async () => {
    await act(async () => {
      renderer.create(
        <StateProvider>
          <Schedules navigation={navigation} route={route} />
        </StateProvider>,
      );
    });
  });
  it('renders SchedulePage page correctly', async () => {
    await act(async () => {
      renderer.create(
        <StateProvider>
          <SchedulePage navigation={navigation} route={route} />
        </StateProvider>,
      );
    });
  });
});
