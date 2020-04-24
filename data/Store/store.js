import React, {createContext, useReducer} from 'react';
import Database from '../Database/Database';
import {SET_FIRST_RENDER} from './actions';

const db = Database.getConnection();

const initialState = {db: db, isFirstRender: true};
const store = createContext(initialState);
const {Provider} = store;

const StateProvider = ({children}) => {
  const [state, dispatch] = useReducer((state, action) => {
    const {type, key, value} = action;
    switch (type) {
      case SET_FIRST_RENDER:
        return {...state, isFirstRender: value};
      default:
        throw new Error();
    }
  }, initialState);

  return <Provider value={{state, dispatch}}>{children}</Provider>;
};

export {store, StateProvider};
