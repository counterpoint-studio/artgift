export type GiftSlot = {
    id: string;
    region: string;
    time: number;
    status: 'available' | 'reserved' | 'onHold'
}

export function subscribeToGiftSlotsOverview(callback: (slots: GiftSlot[]) => void) {
    // Mock response
    setTimeout(() => {
        let data: GiftSlot[] = [];
        let id = 0;
        for (let day of [7, 8, 9]) {
            for (let hour of [12, 13, 14, 15, 16, 17, 18, 19]) {
                for (let region of ['ETELÄINEN', 'LÄNTINEN', 'KESKINEN', 'KOILLINEN', 'ITÄINEN & ÖSTERSUNDOM']) {
                    data.push({
                        id: `${id++}`,
                        region,
                        status: 'available',
                        time: new Date(2020, 7, hour, 0).getTime()
                    }, {
                        id: `${id++}`,
                        region,
                        status: 'available',
                        time: new Date(2020, 7, day, hour, 30).getTime()
                    })
                }
                for (let region of ['POHJOINEN', 'KAAKKOINEN']) {
                    data.push({
                        id: `${id++}`,
                        region,
                        status: 'available',
                        time: new Date(2020, 7, day, hour, 0).getTime()
                    })
                }
            }
        }
        callback(data)
    }, 100);
}
