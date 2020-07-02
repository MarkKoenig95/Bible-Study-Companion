import React, {createContext, useReducer} from 'react';
import {BibleInfoDB, UserInfoDB} from '../Database/Database';
import {UPDATE_VALUE} from './actions';

async function initializeData() {
  const bibleDB = await BibleInfoDB.getConnection();
  const userDB = await UserInfoDB.getConnection();

  const initialState = {
    bibleDB: bibleDB,
    userDB: userDB,
    isFirstRender: true,
  };

  return initialState;
}

let initialState;
initializeData().then(res => {
  initialState = res;
});

const store = createContext(initialState);
const {Provider} = store;

const StateProvider = ({children}) => {
  let initState = initialState;

  const [state, dispatch] = useReducer((state, action) => {
    const {type, key, value} = action;
    switch (type) {
      case UPDATE_VALUE:
        return {...state, [key]: value};
      default:
        throw new Error();
    }
  }, initState);

  return <Provider value={{state, dispatch}}>{children}</Provider>;
};

export {store, StateProvider};
