import React from 'react';

import {StateProvider} from './data/Store/store';

import AppContainer from './AppContainer';

import {useLocalization} from './localization/localization';

export default function App() {
  useLocalization();

  return (
    <StateProvider>
      <AppContainer />
    </StateProvider>
  );
}
