import { lang as langMonths } from '../lang/months';
import { lang as langDays } from '../lang/days';
import { Day } from '../interfaces/Day';
import { Language } from '../pipes/Language';
import { ApiCalendar } from '../services/ApiCalendar';
import { stringify } from 'node:querystring';

export class Calendar {

    private api;

    /**
     * Language in which the calendar is going to be displayed
     */
    lang: string;

    /**
     * Current date
     */
    private currentDate: Date;

    /**
     * Names of the months
     */
    monthsName: string[] = [];

    /**
     * Names of the days
     */
    daysName: string[] = [];

    /**
     * 
     */
    busyHours: string[] = [];

    /**
     * @param key {string} Google Calendar API KEY
     */
    constructor(lang: Language) {
        this.lang = lang;
        this.monthsName = langMonths[lang] as string[];
        this.daysName = langDays[lang] as string[];
        let today = new Date();
        this.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
        this.api = new ApiCalendar();
    }

    /**
     * Get names of months
     * @returns an array of months
     */
    getMonthsName(): string[] {
        return this.monthsName;
    }

    /**
     * Get the name of the month of the currentDate 
     * @returns the requested month name
     */
    getMonthName(): string {
        let month: number = this.currentDate.getMonth();
        return this.monthsName[month];
    }

    /**
     * 
     * @returns currentDate's year 
     */
    getFullYear() {
        return this.currentDate.getFullYear();
    }

    /**
     * Get initial letter of the days
     * @returns an array of days
     */
    getDaysName(): string[] {
        return this.daysName;
    }

    /**
     * Get the name of a day indicated by number
     * @param day {number} Number of a day of the week, starting from 0
     * @returns the requested day name
     */
    getDayName(day: number): string {
        if (day >= this.daysName.length) {
            throw new Error('Day cannot be greater than 6.');
        }
        return this.daysName[day];
    }

    /**
     * Get the number of days of a month
     * @param month {number} Number of the month, starting from 1, which we want to know how many days does it have
     * @param year {number} Number of the year
     * @returns the number of days that the requested month has
     */
    getMonthDays(): number {
        let month: number = this.currentDate.getMonth();
        let year: number = this.currentDate.getFullYear();
        return new Date(year, month + 1, 0).getDate();
    };

    /**
     * Get the first day of the month as a number
     * @returns the number of the day, starting from 0 as Sunday
     */
    getFirstDayOfMonth(): number {
        return this.currentDate.getDay();
    }

    /**
     * Set the month structure
     * @returns an array with the structure of the month
     */
    setMonthStructure(): Day[] {
        const blankSpaces: number = this.getFirstDayOfMonth();
        const monthDays: number = this.getMonthDays();
        let monthStructure: Day[] = new Array(blankSpaces);
        monthStructure.fill(null, 0, blankSpaces);
        let days: Day[] = Array.from({ length: monthDays }, (_, index) => ({ digit: index + 1 + "" } as Day));
        monthStructure = monthStructure.concat(days);
        return monthStructure;
    }

    /**
     * Set the currentDate to the indicated date
     * @param date {Date} date
     */
    changeDate(date: Date) {
        this.currentDate = new Date(date.getFullYear(), date.getMonth(), 1);
    }

    /**
     * Changes month according to the 'isNext' param
     * @returns 
     */
    changeMonth(isNext: boolean) {
        isNext ? this.setNextMonth() : this.setPreviousMonth();
    }

    /**
     * @returns currentDate
     */
    getCurrentDate(): Date {
        return this.currentDate;
    }

    /**
     * Set the currentDate to the previous month
     */
    setPreviousMonth() {
        const today = new Date();
        // Avoid changing to the previous month of the current month.
        if (today < this.currentDate) {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        }
    }

    /**
     * Set the currentDate to the next month
     */
    setNextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    }

    /**
     * Check if the day is before today
     * @param day {Day}
     * @returns If the day is before today 
     */
    isDayBeforeToday(day: Day) {
        const today = new Date();
        return day?.digit && parseInt(day.digit) < today.getDate()
            && today.getMonth() == this.getCurrentDate().getMonth()
            && today.getFullYear() == this.getCurrentDate().getFullYear();
    }

    /**
     * Check if the day is today
     * @param day {Day} with which will be checked if it is equals today
     * @returns true is both are today, false if not
     */
    isToday(day: Day) {
        const today = new Date();
        return day?.digit && parseInt(day.digit) == today.getDate()
            && this.getCurrentDate().getMonth() == today.getMonth()
            && this.getCurrentDate().getFullYear() == today.getFullYear()
    }

    /**
     * Checks if current month is equals today's month 
     * @returns true if the current month is equals today's month, false if not
     */
    isMonthEqualsTodaysMonth() {
        return this.getCurrentDate().getMonth() == new Date().getMonth()
            && this.getCurrentDate().getFullYear() == new Date().getFullYear();
    }

    /**
     * Know the day digit
     * @param day {Day}
     * @returns the digit day
     */
    getDayDigit(day: Day): string {
        return (day?.digit) ? day.digit : "";
    }

    /**
     * 
     * @param day 
     */
    setDay(day: string): Promise<boolean> {
        const date: Date = new Date(this.currentDate.getFullYear(),
            this.currentDate.getMonth(),
            parseInt(day), 1)
        return new Promise((resolve, reject) => {
            this.api.get(date)
            .then((data) => {
                this.setBusyHours(data);
                resolve(true);
            }).catch((error) => {
                reject(true);
            })
        });
    }

    /**
     * 
     * @param json 
     */
    setBusyHours(json: any[]): void {
        const busyHours: string[] = [];
        json.forEach((item) => {
            let hourT = item.start.dateTime.split("T")[1].split("+")[0];
            let hour = hourT.split(":")[0];
            let minutes = hourT.split(":")[1];
            hour = hour + ":" + minutes;
            busyHours.push(hour)
        })
        this.busyHours = busyHours;
    }

    foo(day: Day) {
        const busyHours: string[] = this.busyHours;
        day.hours = day.hours.filter(function (val: string) {
            return busyHours.indexOf(val) == -1;
        });
        return day;
    }

}
