import { HalfDayType } from '../types';

export const HALF_DAY_TYPES = {
    FULL: "FULL" as HalfDayType,
    AM: "AM" as HalfDayType,
    PM: "PM" as HalfDayType,
    NONE: "NONE" as HalfDayType,
} as const; 