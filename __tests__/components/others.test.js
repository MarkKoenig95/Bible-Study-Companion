import React from 'react';
import renderer from 'react-test-renderer';
import SectionListHeader from '../../components/SectionListHeader';
import SettingsWrapper from '../../components/SettingsWrapper';

describe('testing if others render', () => {
  it('renders SectionListHeader correctly', () => {
    renderer.create(<SectionListHeader section={{title: 'Test'}} />);
  });
  it('renders SettingsWrapper correctly', () => {
    renderer.create(<SettingsWrapper />);
  });
});
