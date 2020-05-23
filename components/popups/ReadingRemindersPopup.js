import React from 'react';

import {View} from 'react-native';

import Popup from './Popup';
import {Body, SubHeading, Heading} from '../text/Text';
import Link from '../text/Link';

export default function ReadingRemindersPopup(props) {
  return (
    <Popup {...props} title="Reading Reminders">
      <View>
        <Heading>Create the right surroundings</Heading>
        <Body>Find a location that is quiet and free from distractions</Body>
        <Body>(Perhaps put your phone into silent mode)</Body>

        <Heading>Pray before you read</Heading>
        <Body>
          Ask Jehovah to put you in the proper frame of mind and to give you his
          Holy Spirit to help you understand and apply what you read.
        </Body>

        <Heading>Meditate on what you read</Heading>

        <Body>Don’t rush, read to understand.</Body>

        <SubHeading>You could ask these questions:</SubHeading>
        <Body>What does this tell me about Jehovah God?</Body>
        <Body>
          How does this section of the Scriptures contribute to the Bible’s
          message?
        </Body>
        <Body>How can I apply this in my life?</Body>
        <Body>How can I use these verses to help others?</Body>

        <SubHeading>Imagine yourself in the scene:</SubHeading>

        <Body>What would you see, hear, and smell? </Body>
        <Body>What may be the feelings of those involved?</Body>

        <SubHeading>Do research in order to:</SubHeading>

        <Body>Understand the reading portion’s context.</Body>
        <Body>Understand difficult concepts clearly.</Body>

        <Heading>Apply what you read</Heading>

        <Body>
          If we see the practical value of an activity, we benefit more from it.
        </Body>

        <Body>
          We need to take action to apply what we learned in our life and
          understand how we can use what we learned to help others.
        </Body>
      </View>

      <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
        <SubHeading>Reminders derived from:</SubHeading>
        <Link
          href="https://wol.jw.org/en/wol/d/r1/lp-e/1001070190"
          text="nwt 36; "
        />

        <Link
          href="https://wol.jw.org/en/wol/pc/r1/lp-e/1200270805/284/0"
          text="mwb18.03 8; "
        />

        <Link
          href="https://wol.jw.org/en/wol/pc/r1/lp-e/1200275571/75/2"
          text="w12 1/15 15; "
        />

        <Link
          href="https://wol.jw.org/en/wol/pc/r1/lp-e/1200270805/283/2"
          text="wp17.1 4; "
        />

        <Link
          href="https://wol.jw.org/en/wol/pc/r1/lp-e/1200270805/283/4"
          text="w16.05 24-26; "
        />

        <Body>
          Please go to those links do get a deeper understanding of the thoughts
          expressed
        </Body>
      </View>
    </Popup>
  );
}
