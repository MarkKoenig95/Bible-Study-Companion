import React from 'react';

import {StateProvider} from './data/Store/store';

import AppContainer from './AppContainer';

import {useLocalization} from './logic/localization/localization';
import {log} from './data/Database/generalTransactions';

export default function App() {
  log('App loaded');
  useLocalization();

  return (
    <StateProvider>
      <AppContainer />
    </StateProvider>
  );
}
