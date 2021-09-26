import React from 'react';

import {View} from 'react-native';

import {Body, SubHeading} from '../../text/Text';
import Link from '../../text/Link';

import {translate} from '../../../logic/localization/localization';
import {makeJWLibLink} from './logic/generalLogic';
import {BibleBookInfo} from './types';

const prefix = 'readingInfoPopup.';

export function InfoSegment(props: {
  info: BibleBookInfo;
  segment: 'id' | 'name' | 'whereWritten' | 'whenWritten' | 'timeCovered';
  testID: string;
}) {
  const {info, segment, testID} = props;

  const hasInfo = info[segment] ? true : false;

  return (
    <View>
      {hasInfo && <SubHeading>{translate(prefix + segment)}:</SubHeading>}
      {hasInfo && <Body testID={testID}>{info[segment]}</Body>}
    </View>
  );
}

export function ReadingInfoSection(props: {
  bookNumber: number;
  items: BibleBookInfo[];
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number;
  readingPortion: string;
  testID: string;
}) {
  const {
    bookNumber,
    items,
    startChapter,
    startVerse,
    endChapter,
    endVerse,
    readingPortion,
    testID,
  } = props;

  const href = makeJWLibLink(
    bookNumber,
    startChapter,
    startVerse,
    endChapter,
    endVerse,
  );

  const info = items[bookNumber];

  return (
    <View testID={testID} style={{alignSelf: 'flex-start', margin: 15}}>
      <SubHeading>{translate(prefix + 'readingPortion')}:</SubHeading>
      <Link testID={testID + '.link'} href={href} text={readingPortion} />

      <InfoSegment
        testID={testID + '.whereWritten'}
        segment="whereWritten"
        info={info}
      />

      <InfoSegment
        testID={testID + '.whenWritten'}
        segment="whenWritten"
        info={info}
      />

      <InfoSegment
        testID={testID + '.timeCovered'}
        segment="timeCovered"
        info={info}
      />
    </View>
  );
}
