import React, {useContext, useEffect, useState, useRef} from 'react';

import Popup from '../Popup';
import IconButton from '../../buttons/IconButton';
import {ReadingInfoSection} from './components';

import {translate} from '../../../logic/localization/localization';

import {store} from '../../../data/Store/store';
import {createReadingSections, loadData} from './logic/generalLogic';
import {BibleBookInfo, PopupProps, InfoSection} from './types';

const prefix = 'readingInfoPopup.';

const blankInfo: BibleBookInfo = {
  id: 1,
  name: '',
  whereWritten: '',
  whenWritten: '',
  timeCovered: '',
};

var items = [blankInfo];

export default function ReadingInfoPopup(props: {
  onConfirm: () => void;
  endBookNumber: number;
  endChapter: number;
  endVerse: number;
  popupProps: PopupProps;
  startBookNumber: number;
  startChapter: number;
  startVerse: number;
  testID: string;
}) {
  const {
    onConfirm,
    popupProps,
    testID,
    startBookNumber,
    startChapter,
    startVerse,
    endBookNumber,
    endChapter,
    endVerse,
  } = props;

  const globalState = useContext(store);
  const {bibleDB} = globalState.state;
  const blankArray: InfoSection[] = [];

  const [readingSections, setReadingSections] = useState(blankArray);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (bibleDB) {
      createReadingSections(
        bibleDB,
        startBookNumber,
        startChapter,
        startVerse,
        endBookNumber,
        endChapter,
        endVerse,
      ).then((res) => {
        if (mountedRef.current) {
          setReadingSections(res);
        }
      });
    }
  }, [
    bibleDB,
    startBookNumber,
    startChapter,
    startVerse,
    endBookNumber,
    endChapter,
    endVerse,
  ]);

  useEffect(() => {
    if (bibleDB) {
      loadData(bibleDB).then((tempItems) => {
        items = tempItems;
      });
    }
  }, [bibleDB]);

  return (
    <Popup
      {...popupProps}
      testID={testID}
      title={translate(prefix + 'readingInfo')}>
      {readingSections.map((section) => {
        return (
          <ReadingInfoSection
            testID={testID + '.' + section.key}
            key={section.key}
            items={items}
            bookNumber={section.bookNumber}
            startChapter={section.startChapter}
            startVerse={section.startVerse}
            endChapter={section.endChapter}
            endVerse={section.endVerse}
            readingPortion={section.readingPortion}
          />
        );
      })}
      <IconButton
        testID={testID + '.confirmButton'}
        name="check"
        onPress={onConfirm}
      />
    </Popup>
  );
}
