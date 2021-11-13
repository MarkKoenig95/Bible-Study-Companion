import React from 'react';

import {StateProvider} from './data/Store/store';

import AppContainer from './AppContainer';

import {log} from './data/Database/generalTransactions';

export default function App() {
  log('App loaded');

  return (
    <StateProvider>
      <AppContainer />
    </StateProvider>
  );
}
