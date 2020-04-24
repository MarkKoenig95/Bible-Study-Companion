import React, {createContext, useReducer} from 'react';
import Database from '../Database/Database';

const db = Database.getConnection();
console.log('db is:', db);

const initialState = {db: db, test: 'Hello'};
const store = createContext(initialState);
const {Provider} = store;

const StateProvider = ({children}) => {
  const [state, dispatch] = useReducer((state, action) => {
    const {type, key, value} = action;
    switch (type) {
      case 'UPDATE_VALUE':
        return {...state, [key]: value};
      default:
        throw new Error();
    }
  }, initialState);

  return <Provider value={{state, dispatch}}>{children}</Provider>;
};

export {store, StateProvider};
