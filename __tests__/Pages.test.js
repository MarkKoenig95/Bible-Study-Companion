import 'react-native';
import React from 'react';
import Home from '../pages/Home';
import Notification from '../pages/Notification';
import Notifications from '../pages/Notifications';
import Reminders from '../pages/Reminders';
import SchedulePage from '../pages/SchedulePage';
import Schedules from '../pages/Schedules';
import Settings from '../pages/Settings';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';
import {StateProvider} from '../data/Store/store';

jest.mock('../data/Store/store');

const navigation = {dispatch: jest.fn(), setOptions: jest.fn()};
const route = {params: {name: 'A', table: 'tblA', id: 0}};

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

  it('renders Notification page correctly', async () => {
    await act(async () => {
      renderer.create(
        <StateProvider>
          <Notification navigation={navigation} route={route} />
        </StateProvider>,
      );
    });
  });

  it('renders Notifications page correctly', async () => {
    await act(async () => {
      renderer.create(
        <StateProvider>
          <Notifications navigation={navigation} route={route} />
        </StateProvider>,
      );
    });
  });

  it('renders Reminders page correctly', async () => {
    await act(async () => {
      renderer.create(
        <StateProvider>
          <Reminders navigation={navigation} route={route} />
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

  it('renders Schedules page correctly', async () => {
    await act(async () => {
      renderer.create(
        <StateProvider>
          <Schedules navigation={navigation} route={route} />
        </StateProvider>,
      );
    });
  });

  it('renders Settings page correctly', async () => {
    await act(async () => {
      renderer.create(
        <StateProvider>
          <Settings navigation={navigation} route={route} />
        </StateProvider>,
      );
    });
  });
});
