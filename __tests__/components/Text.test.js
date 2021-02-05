import React from 'react';
import renderer from 'react-test-renderer';
import Text, {
  Body,
  SubHeading,
  Heading,
  LargeText,
} from '../../components/text/Text';
import Link from '../../components/text/Link';

describe('testing if text renders', () => {
  it('renders Text correctly', () => {
    renderer.create(<Text />);
  });
  it('renders Body correctly', () => {
    renderer.create(<Body />);
  });
  it('renders SubHeading correctly', () => {
    renderer.create(<SubHeading />);
  });
  it('renders Heading correctly', () => {
    renderer.create(<Heading />);
  });
  it('renders LargeText correctly', () => {
    renderer.create(<LargeText />);
  });
  it('renders Link correctly', () => {
    renderer.create(<Link />);
  });
});
