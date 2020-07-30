import { padStart } from 'lodash';

const DAYS_OF_WEEK = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
]
export function formatDate(dateS: string) {
    let y = +dateS.substring(0, 4)
    let m = +dateS.substring(4, 6)
    let d = +dateS.substring(6, 8)
    let date = new Date(y, m - 1, d)
    let dayOfWeek = DAYS_OF_WEEK[date.getDay()];
    return `${dayOfWeek} ${d}.${m}.`
}

export function formatDateFromComponents(year: number, month: number, day: number) {
    return `${day}.${month + 1}.${year}`;
}

export function formatTime(time: string) {
    let [hours, minutes] = time.split(":").map(t => +t)
    let h = hours < 10 ? `0${hours}` : `${hours}`
    let m = minutes < 10 ? `0${minutes}` : `${minutes}`
    return `${h}:${m}`
}

export function formatTimeFromComponents(hours: number, minutes: number) {
    return `${padStart('' + hours, 2, "0")}:${'' + padStart('' + minutes, 2, '0')}`;
}

export function parseDateAndTime(date: string, time: string) {
    return new Date(
        +date.substring(0, 4),
        +(date.substring(4, 6)) - 1,
        +date.substring(6, 8),
        +time.substring(0, 2),
        +time.substring(3, 5)
    );
}
