import {ScheduleType} from '../../../logic/general';

export type onAddFunc = (
  scheduleName: string,
  doesTrack: boolean,
  duration: number,
  bookId: number,
  chapter: number,
  verse: number,
  startingPortion: number,
  maxPortion: number,
  readingPortionDesc: string,
  portionsPerDay: number,
  startDate?: Date,
) => void;

export interface CreateSchedulePopupProps {
  displayPopup: boolean;
  onAdd: onAddFunc;
  onClosePress: () => void;
  onError: (error: string) => void;
  testID: string;
  type: ScheduleType;
}

export type item = {id: number; name: string};
