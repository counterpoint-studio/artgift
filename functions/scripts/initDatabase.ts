import * as fs from 'fs';
import * as admin from 'firebase-admin';

admin.initializeApp();

let db = admin.firestore();

let seedFileName = process.argv[2];
let seedData = JSON.parse(fs.readFileSync(seedFileName, 'utf-8'));

async function initDatabase() {
    let storeStatus = (await db.collection('appstates').doc('singleton').get()).data()?.state;
    let messages = db.collection('messages');
    let gifts = db.collection('gifts');
    let slots = db.collection('slots');
    let reservations = db.collection('reservations');
    let artists = db.collection('artists');
    let auditLogs = db.collection('auditlogs');

    await messages.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));
    await reservations.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));
    await gifts.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));
    await slots.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));
    await artists.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));
    await auditLogs.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));

    let batch = db.batch();
    if (!storeStatus) {
        batch.set(db.collection('appstates').doc('singleton'), { state: 'pre' })
    }
    for (let region of Object.keys(seedData.slots)) {
        for (let date of Object.keys(seedData.slots[region])) {
            for (let time of seedData.slots[region][date]) {
                batch.set(slots.doc(), { date, time, region, status: storeStatus === 'open' ? 'available' : 'notAvailable' });
            }
        }
    }
    for (let artist of seedData.artists) {
        for (let it of artist.itineraries || []) {
            it.assignments = [];
        }
        batch.set(artists.doc(), artist);
    }

    await batch.commit();
}


initDatabase();