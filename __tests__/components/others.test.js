import React from 'react';
import renderer, {act} from 'react-test-renderer';
import SectionListHeader from '../../components/SectionListHeader';
import SettingsWrapper from '../../components/SettingsWrapper';

describe('testing if others render', () => {
  it('renders SectionListHeader correctly', async () => {
    await act(async () => {
      renderer.create(<SectionListHeader section={{title: 'Test'}} />);
    });
  });
  it('renders SettingsWrapper correctly', async () => {
    await act(async () => {
      renderer.create(<SettingsWrapper />);
    });
  });
});
