export interface PopupProps {
  displayPopup: boolean;
  title: string;
  message: string;
  onClosePress: () => void;
}

export interface BibleBookInfo {
  id: number;
  name: string;
  whereWritten: string;
  whenWritten: string;
  timeCovered: string;
}

export interface InfoSection {
  key: string;
  bookNumber: number;
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number;
  readingPortion: string;
}

export interface ReadingPopupState {
  cb: () => void;
  endBookNumber: number;
  endChapter: number;
  endVerse: number;
  isDisplayed: boolean;
  isFinished: boolean;
  message: string;
  startBookNumber: number;
  startChapter: number;
  startVerse: number;
  ID: number;
  readingPortion: string;
  tableName: string;
  title: string;
}
