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

export interface ReadingPopupState {
  cb: () => void;
  endBookNumber?: number;
  endChapter?: number;
  endVerse?: number;
  isDisplayed: boolean;
  message: string;
  startBookNumber?: number;
  startChapter?: number;
  startVerse?: number;
  readingPortion: string;
  title: string;
}

export interface ButtonsPopupState {
  areButtonsFinished: boolean[];
  buttons: Element[];
  isDisplayed: boolean;
  readingDayIDs: number[];
  tableName: string;
}
