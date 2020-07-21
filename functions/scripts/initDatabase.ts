import * as admin from 'firebase-admin';

admin.initializeApp();

let db = admin.firestore();

let argv = process.argv.slice(2);
let dates = argv.filter(a => /\d{8}/.test(a));
let times = argv.filter(a => /\d\d:\d\d/.test(a));
let regions = argv.filter(a => !/\d/.test(a));

async function initDatabase() {
    let smss = db.collection('SMSs');
    let gifts = db.collection('gifts');
    let slots = db.collection('slots');
    let reservations = db.collection('reservations');
    let artists = db.collection('artists');

    await smss.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));
    await reservations.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));
    await gifts.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));
    await slots.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));
    await artists.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));

    let batch = db.batch();
    for (let date of dates) {
        for (let time of times) {
            for (let region of regions) {
                batch.set(slots.doc(), { date, time, region, status: 'available' });
            }
        }
    }
    await batch.commit();
}


initDatabase();