export interface ISettings {
    [key: string]: any,

    'attendance.holiday.day': string,
    'attendance.holiday.month': string,
    'attendance.countZw': boolean,
    'grades.disabled': boolean,
    'grades.values.plus': string,
    'grades.values.minus': string
}

export enum ESettings {
    ATTENDANCE_HOLIDAY_DAY = 'attendance.holiday.day',
    ATTENDANCE_HOLIDAY_MONTH = 'attendance.holiday.month',
    ATTENDANCE_COUNT_ZW_AS_OB = 'attendance.countZw',
    GRADES_DISABLED = 'grades.disabled',
    GRADES_VALUES_PLUS = 'grades.values.plus',
    GRADES_VALUES_MINUS = 'grades.values.minus'
}

export const defaultSettings = {
    'attendance.holiday.day': '01',
    'attendance.holiday.month': '01',
    'attendance.countZw': false,
    'grades.disabled': false,
    'grades.values.plus': '0.25',
    'grades.values.minus': '0.25'
};
