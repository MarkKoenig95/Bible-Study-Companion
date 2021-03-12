import React from 'react';
import renderer, {act} from 'react-test-renderer';
import CheckBox from '../../components/buttons/CheckBox';
import CustomButton from '../../components/buttons/CustomButton';
import IconButton from '../../components/buttons/IconButton';
import ScheduleDayButton from '../../components/buttons/ScheduleDayButton';
import TextButton from '../../components/buttons/TextButton';
import TimePickerButton from '../../components/buttons/TimePickerButton';

describe('testing if buttons render', () => {
  it('renders CheckBox correctly', async () => {
    await act(async () => {
      renderer.create(<CheckBox />);
    });
  });
  it('renders CustomButton correctly', async () => {
    await act(async () => {
      renderer.create(<CustomButton />);
    });
  });
  it('renders IconButton correctly', async () => {
    await act(async () => {
      renderer.create(<IconButton />);
    });
  });
  it('renders ScheduleDayButton correctly', async () => {
    await act(async () => {
      renderer.create(<ScheduleDayButton />);
    });
  });
  it('renders TextButton correctly', async () => {
    await act(async () => {
      renderer.create(<TextButton />);
    });
  });
  it('renders TimePickerButton correctly', async () => {
    await act(async () => {
      renderer.create(<TimePickerButton />);
    });
  });
});
