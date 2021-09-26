import {ScheduleButtonProps} from './ScheduleButton';

export type OpenReadingInfoPopup = (
  startBookNumber: number,
  startChapter: number,
  startVerse: number,
  endBookNumber: number,
  endChapter: number,
  endVerse: number,
  readingPortion: string,
  isFinished: boolean,
  readingDayID: number,
  callback: () => void,
  tableName: string,
) => void;

export type OnUpdateReadStatus = (
  status: boolean,
  readingDayID: number,
  tableName: string,
  isAfterFirstUnfinished: boolean,
) => void;

export interface ButtonsPopupState {
  areButtonsFinished: boolean[];
  buttons: ScheduleButtonProps[];
  isDisplayed: boolean;
  readingDayIDs: number[];
  tableName: string;
}
