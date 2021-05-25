import React from 'react';
import renderer, {act} from 'react-test-renderer';
import CheckBox from '../../components/buttons/CheckBox';
import CustomButton from '../../components/buttons/CustomButton';
import IconButton from '../../components/buttons/IconButton';
import ScheduleDayButton from '../../components/buttons/ScheduleDayButton';
import TextButton from '../../components/buttons/TextButton';
import DateTimePickerButton from '../../components/buttons/DateTimePickerButton';

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
      renderer.create(<DateTimePickerButton mode={'time'} time={new Date()} />);
    });
  });
  it('renders DatePickerButton correctly', async () => {
    await act(async () => {
      renderer.create(<DateTimePickerButton mode={'date'} time={new Date()} />);
    });
  });
});
