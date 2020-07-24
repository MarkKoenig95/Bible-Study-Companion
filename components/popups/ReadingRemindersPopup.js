import React from 'react';
import {View} from 'react-native';
import {translate, linkFormulator} from '../../localization/localization';

import Popup from './Popup';
import {Body, SubHeading, Heading} from '../text/Text';
import Link from '../text/Link';

const prefix = 'readingRemindersPopup.';

export default function ReadingRemindersPopup(props) {
  //Links translated
  const nwt36 = linkFormulator(
    'www',
    'library',
    'bible',
    'study-bible',
    'introduction',
    'how-to-read-the-bible',
  );

  const pubLinkBase = linkFormulator('wol', 'wol', 'd', 'r1', 'lp-e');

  const mwb18 = pubLinkBase + '/202018087#h=3:652-6:400';

  const w12 = pubLinkBase + '/2012049#h=1:0-6:503';

  const wp17 = pubLinkBase + '/2017006#h=2:0-17:37';

  const w16 = pubLinkBase + '/2016364#h=14:0-25:930';

  return (
    <Popup
      {...props}
      style={{height: '75%'}}
      title={translate(prefix + 'readingReminders')}>
      <View>
        <Heading>{translate(prefix + 'heading0')}</Heading>
        <Body>{translate(prefix + 'body0-1')}</Body>
        <Body>{translate(prefix + 'body0-2')}</Body>

        <Heading>{translate(prefix + 'heading1')}</Heading>
        <Body>{translate(prefix + 'body1-1')}</Body>

        <Heading>{translate(prefix + 'heading2')}</Heading>

        <Body>{translate(prefix + 'body2-1')}</Body>

        <SubHeading>{translate(prefix + 'subheading2-1')}</SubHeading>
        <Body>{translate(prefix + 'body2-2')}</Body>
        <Body>{translate(prefix + 'body2-3')}</Body>
        <Body>{translate(prefix + 'body2-4')}</Body>
        <Body>{translate(prefix + 'body2-5')}</Body>

        <SubHeading>{translate(prefix + 'subheading2-2')}</SubHeading>

        <Body>{translate(prefix + 'body2-6')}</Body>
        <Body>{translate(prefix + 'body2-7')}</Body>

        <SubHeading>{translate(prefix + 'subheading2-3')}</SubHeading>

        <Body>{translate(prefix + 'body2-8')}</Body>
        <Body>{translate(prefix + 'body2-9')}</Body>

        <Heading>{translate(prefix + 'heading3')}</Heading>

        <Body>{translate(prefix + 'body3-1')}</Body>

        <Body>{translate(prefix + 'body3-2')}</Body>
      </View>

      <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
        <SubHeading>{translate(prefix + 'subheading3-1')}</SubHeading>

        <Link href={nwt36} text="nwt 36; " />

        <Link href={mwb18} text="mwb18.03 8; " />

        <Link href={w12} text="w12 1/15 15; " />

        <Link href={wp17} text="wp17.1 4; " />

        <Link href={w16} text="w16.05 24-26; " />

        <Body>{translate(prefix + 'body3-3')}</Body>
      </View>
    </Popup>
  );
}
