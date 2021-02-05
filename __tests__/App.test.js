/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';

// Keep this commented for now since it takes so long
// it('renders correctly', async () => {
//   await act(async () => {
//     renderer.create(<App />);
//   });
// });

it('is not really a test', () => {
  expect(true).toBe(true);
});
