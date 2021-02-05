import React from 'react';
import renderer from 'react-test-renderer';
import CreateNotificationPopup from '../../components/popups/CreateNotificationPopup';
import CreateReminderPopup from '../../components/popups/CreateReminderPopup';
import CreateSchedulePopup from '../../components/popups/CreateSchedulePopup';
import LoadingPopup from '../../components/popups/LoadingPopup';
import MessagePopup from '../../components/popups/MessagePopup';
import Popup from '../../components/popups/Popup';
import ReadingInfoPopup from '../../components/popups/ReadingInfoPopup';
import ReadingRemindersPopup from '../../components/popups/ReadingRemindersPopup';
import ScheduleTypeSelectionPopup from '../../components/popups/ScheduleTypeSelectionPopup';
import SelectedDayButtonsPopup from '../../components/popups/SelectedDayButtonsPopup';

import {StateProvider} from '../../data/Store/store';

jest.mock('../../data/Store/store');

beforeAll(() => {
  // Tell Jest to use a different timer implementation. You can also
  // configure this in your jest.config.js file. For more info see
  // https://jestjs.io/docs/en/configuration#timers-string).
  jest.useFakeTimers('modern');

  jest.setSystemTime(new Date('04 Feb 2021 00:12:00 GMT').getTime());
});

afterAll(() => {
  jest.useRealTimers();
});

describe('testing if popups render', () => {
  it('renders CreateNotificationPopup correctly', () => {
    renderer.create(<CreateNotificationPopup />);
  });
  it('renders CreateReminderPopup correctly', () => {
    renderer.create(<CreateReminderPopup />);
  });
  it('renders CreateSchedulePopup correctly', () => {
    renderer.create(
      <StateProvider>
        <CreateSchedulePopup />
      </StateProvider>,
    );
  });
  it('renders LoadingPopup correctly', () => {
    renderer.create(<LoadingPopup />);
  });
  it('renders MessagePopup correctly', () => {
    renderer.create(<MessagePopup />);
  });
  it('renders Popup and matches snapshot', () => {
    const tree = renderer.create(<Popup />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  it('renders ReadingInfoPopup correctly', () => {
    renderer.create(
      <StateProvider>
        <ReadingInfoPopup />
      </StateProvider>,
    );
  });
  it('renders ReadingRemindersPopup and matches snapshot', () => {
    const tree = renderer.create(<ReadingRemindersPopup />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  it('renders ScheduleTypeSelectionPopup correctly', () => {
    renderer.create(<ScheduleTypeSelectionPopup />);
  });
  it('renders SelectedDayButtonsPopup correctly', () => {
    renderer.create(<SelectedDayButtonsPopup buttons={[]} />);
  });
});
