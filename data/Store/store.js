import React, {createContext, useReducer} from 'react';
import {BibleInfoDB, UserInfoDB} from '../Database/Database';
import {UPDATE_VALUE} from './actions';

const bibleDB = BibleInfoDB.getConnection();
const userDB = UserInfoDB.getConnection();

const initialState = {
  bibleDB: bibleDB,
  userDB: userDB,
  isFirstRender: true,
};
const store = createContext(initialState);
const {Provider} = store;

const StateProvider = ({children}) => {
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
};

export {store, StateProvider};
