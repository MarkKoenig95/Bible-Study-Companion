import React from 'react';
import renderer, {act} from 'react-test-renderer';
import Text, {
  Body,
  SubHeading,
  Heading,
  LargeText,
} from '../../components/text/Text';
import Link from '../../components/text/Link';

describe('testing if text renders', () => {
  it('renders Text correctly', async () => {
    await act(async () => {
      renderer.create(<Text />);
    });
  });
  it('renders Body correctly', async () => {
    await act(async () => {
      renderer.create(<Body />);
    });
  });
  it('renders SubHeading correctly', async () => {
    await act(async () => {
      renderer.create(<SubHeading />);
    });
  });
  it('renders Heading correctly', async () => {
    await act(async () => {
      renderer.create(<Heading />);
    });
  });
  it('renders LargeText correctly', async () => {
    await act(async () => {
      renderer.create(<LargeText />);
    });
  });
  it('renders Link correctly', async () => {
    await act(async () => {
      renderer.create(<Link />);
    });
  });
});
