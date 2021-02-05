import React from 'react';
import renderer from 'react-test-renderer';
import CheckBox from '../../components/buttons/CheckBox';
import CustomButton from '../../components/buttons/CustomButton';
import IconButton from '../../components/buttons/IconButton';
import ScheduleDayButton from '../../components/buttons/ScheduleDayButton';
import TextButton from '../../components/buttons/TextButton';
import TimePickerButton from '../../components/buttons/TimePickerButton';

describe('testing if buttons render', () => {
  it('renders CheckBox correctly', () => {
    renderer.create(<CheckBox />);
  });
  it('renders CustomButton correctly', () => {
    renderer.create(<CustomButton />);
  });
  it('renders IconButton correctly', () => {
    renderer.create(<IconButton />);
  });
  it('renders ScheduleDayButton correctly', () => {
    renderer.create(<ScheduleDayButton />);
  });
  it('renders TextButton correctly', () => {
    renderer.create(<TextButton />);
  });
  it('renders TimePickerButton correctly', () => {
    renderer.create(<TimePickerButton />);
  });
});
