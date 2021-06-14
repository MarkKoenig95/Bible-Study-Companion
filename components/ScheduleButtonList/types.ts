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
