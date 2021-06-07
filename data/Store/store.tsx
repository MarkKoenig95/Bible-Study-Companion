import React, {createContext, useReducer} from 'react';
import {UPDATE_VALUE} from './actions';

let initialState: any = {
  bibleDB: null,
  userDB: null,
  isFirstRender: true,
  updatePages: 0,
};

const store = createContext(initialState);
const {Provider} = store;

function StateProvider({children}: {children: any}) {
  const [state, dispatch] = useReducer(
    (state: any, action: {type: string; key: string; value: string}) => {
      const {type, key, value} = action;
      switch (type) {
        case UPDATE_VALUE:
          return {...state, [key]: value};
        default:
          throw new Error();
      }
    },
    initialState,
  );

  return <Provider value={{state, dispatch}}>{children}</Provider>;
}

export {store, StateProvider};
