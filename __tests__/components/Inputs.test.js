import React from 'react';
import renderer, {act} from 'react-test-renderer';
import CustomDropdown from '../../components/inputs/CustomDropdown';
import CustomInput from '../../components/inputs/CustomInput';
import CustomPickerA from '../../components/inputs/CustomPicker.android';
import CustomPickerIOS from '../../components/inputs/CustomPicker.ios';
import DateTimePicker from '../../components/inputs/DateTimePicker';
import VersePicker from '../../components/inputs/VersePicker';
import WeekdayPicker from '../../components/inputs/WeekdayPicker';

import {StateProvider} from '../../data/Store/store';

jest.mock('../../data/Store/store');

describe('testing if inputs render', () => {
  it('renders CustomDropdown correctly', async () => {
    await act(async () => {
      renderer.create(<CustomDropdown />);
    });
  });
  it('renders CustomInput correctly', async () => {
    await act(async () => {
      renderer.create(<CustomInput />);
    });
  });
  it('renders CustomPickerA correctly', async () => {
    await act(async () => {
      renderer.create(
        <CustomPickerA currentValue={0} values={[{label: 'a', value: 1}]} />,
      );
    });
  });
  it('renders CustomPickerIOS correctly', async () => {
    await act(async () => {
      renderer.create(
        <CustomPickerIOS currentValue={0} values={[{label: 'a', value: 1}]} />,
      );
    });
  });
  it('renders DateTimePicker correctly', async () => {
    await act(async () => {
      renderer.create(<DateTimePicker />);
    });
  });
  it('renders VersePicker correctly', async () => {
    await act(async () => {
      renderer.create(
        <StateProvider>
          <VersePicker />
        </StateProvider>,
      );
    });
  });
  it('renders WeekdayPicker correctly', async () => {
    await act(async () => {
      renderer.create(
        <WeekdayPicker currentValue={0} values={[{label: 'a', value: 1}]} />,
      );
    });
  });
});
