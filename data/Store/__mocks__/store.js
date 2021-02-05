import React, {createContext, useReducer} from 'react';
import {UPDATE_VALUE} from '../actions';

import SQLite from 'react-native-sqlite-storage';
const DB = SQLite.openDatabase();

let initialState = {
  bibleDB: DB,
  userDB: DB,
  isFirstRender: true,
  updatePages: 0,
};

const store = createContext(initialState);
const {Provider} = store;

function StateProvider({children}) {
  const [state, dispatch] = useReducer((state, action) => {
    const {type, key, value} = action;
    switch (type) {
      case UPDATE_VALUE:
        return {...state, [key]: value};
      default:
        throw new Error();
    }
  }, initialState);

  return <Provider value={{state, dispatch}}>{children}</Provider>;
}

export {store, StateProvider};
