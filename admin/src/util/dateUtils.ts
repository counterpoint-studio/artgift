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

export function formatTime(time: string) {
    let [hours, minutes] = time.split(":").map(t => +t)
    let h = hours < 10 ? `0${hours}` : `${hours}`
    let m = minutes < 10 ? `0${minutes}` : `${minutes}`
    return `${h}:${m}`
}
