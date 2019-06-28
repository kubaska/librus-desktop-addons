export interface ISettings {
    [key: string]: any,

    'attendance.holiday.day': string,
    'attendance.holiday.month': string,
    'attendance.countZw': boolean,
}

export enum ESettings {
    ATTENDANCE_HOLIDAY_DAY = 'attendance.holiday.day',
    ATTENDANCE_HOLIDAY_MONTH = 'attendance.holiday.month',
    ATTENDANCE_COUNT_ZW_AS_OB = 'attendance.countZw',
}

export const defaultSettings = {
    'attendance.holiday.day': '01',
    'attendance.holiday.month': '01',
    'attendance.countZw': false,
};
