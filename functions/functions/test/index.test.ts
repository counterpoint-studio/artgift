import path from 'path';
import dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import firebaseTest from 'firebase-functions-test';
import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { fail } from 'assert';
import sinon from 'sinon';

dotenv.config({ path: path.resolve('..', '..', 'frontend', '.env.test') })

admin.initializeApp({
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    projectId: process.env.FIREBASE_PROJECT_ID,
    credential: admin.credential.cert(require('../../art-gift-test-firebase-adminsdk-credentials.json'))
});
let test = firebaseTest({
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    projectId: process.env.FIREBASE_PROJECT_ID
}, '../art-gift-test-firebase-adminsdk-credentials.json')


test.mockConfig({ artgift: { testmode: true } });

sinon.stub(admin, 'initializeApp');
let functions = require('../src/index');
let db = admin.firestore();

describe('store availability toggle', function () {
    this.timeout(10000);

    beforeEach(async () => {
        await clearDatabase();
        await sleep();
    });

    it('flips notAvailable slots to available when opened', async () => {
        await createSlots({
            one: { status: 'notAvailable', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'notAvailable', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
        });

        await db.collection('appstates').doc('singleton').set({ state: 'open' });
        await sleep();

        expect((await slot('one').get()).data()?.status).to.equal('available');
        expect((await slot('two').get()).data()?.status).to.equal('available');
        expect((await slot('three').get()).data()?.status).to.equal('reserved');
    });

    it('flips available slots to notAvailable when post', async () => {
        await db.collection('appstates').doc('singleton').set({ state: 'open' });

        await createSlots({
            one: { status: 'available', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'available', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
        });

        await db.collection('appstates').doc('singleton').set({ state: 'post' });
        await sleep();

        expect((await slot('one').get()).data()?.status).to.equal('notAvailable');
        expect((await slot('two').get()).data()?.status).to.equal('notAvailable');
        expect((await slot('three').get()).data()?.status).to.equal('reserved');
    });

    it('flips available slots to notAvailable when pre', async () => {
        await db.collection('appstates').doc('singleton').set({ state: 'open' });

        await createSlots({
            one: { status: 'available', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'available', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
        });

        await db.collection('appstates').doc('singleton').set({ state: 'pre' });
        await sleep();

        expect((await slot('one').get()).data()?.status).to.equal('notAvailable');
        expect((await slot('two').get()).data()?.status).to.equal('notAvailable');
        expect((await slot('three').get()).data()?.status).to.equal('reserved');
    });

    it('flips available slots to notAvailable when paused', async () => {
        await db.collection('appstates').doc('singleton').set({ state: 'open' });

        await createSlots({
            one: { status: 'available', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'available', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
        });

        await db.collection('appstates').doc('singleton').set({ state: 'paused' });
        await sleep();

        expect((await slot('one').get()).data()?.status).to.equal('notAvailable');
        expect((await slot('two').get()).data()?.status).to.equal('notAvailable');
        expect((await slot('three').get()).data()?.status).to.equal('reserved');
    });

});


describe('slot reservations', function () {
    this.timeout(15000);

    beforeEach(async () => {
        await clearDatabase();
        await sleep();
    });

    it('reserves a free slot for 15 minutes', async () => {
        await createSlots({
            free: { status: 'available', date: '20200726', time: '12:00', region: 'South' }
        });
        await gift('mine').set({ status: 'creating' });
        await db.collection('reservations').doc('new').set({ slotId: 'free', giftId: 'mine' });
        await sleep();

        let theGift = await gift('mine').get();
        let theSlot = await slot('free').get();

        expect(theGift.data()?.processedReservationId).to.equal('new');
        expect(theGift.data()?.slotId).to.equal('free');
        expect(theGift.data()?.reservedUntil).to.be.at.most(Date.now() + 15 * 60 * 1000);
        expect(theSlot.data()?.status).to.equal('reserved');
    });

    it('refreshes the reservation if the slot was already reserved for the same gift', async () => {
        await createSlots({
            reservedForMe: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' }
        });
        await gift('mine').set({ status: 'creating', slotId: 'reservedForMe', reservedUntil: Date.now() + 3 * 60 * 1000 });
        await db.collection('reservations').doc('new').set({ slotId: 'reservedForMe', giftId: 'mine' });
        await sleep();

        let theGift = await gift('mine').get();
        let theSlot = await slot('reservedForMe').get();

        expect(theGift.data()?.processedReservationId).to.equal('new');
        expect(theGift.data()?.slotId).to.equal('reservedForMe');
        expect(theGift.data()?.reservedUntil).to.be.at.most(Date.now() + 15 * 60 * 1000);
        expect(theSlot.data()?.status).to.equal('reserved');
    });

    it('sets previous slot back to available', async () => {
        await createSlots({
            previous: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            next: { status: 'available', date: '20200726', time: '12:30', region: 'South' }
        });
        await gift('mine').set({ status: 'creating', slotId: 'previous', reservedUntil: Date.now() + 3 * 60 * 1000 });
        await db.collection('reservations').doc('new').set({ slotId: 'next', giftId: 'mine' });
        await sleep();

        let theGift = await gift('mine').get();
        let previousSlot = await slot('previous').get();
        let nextSlot = await slot('next').get();

        expect(theGift.data()?.processedReservationId).to.equal('new');
        expect(theGift.data()?.slotId).to.equal('next');
        expect(theGift.data()?.reservedUntil).to.be.at.most(Date.now() + 15 * 60 * 1000);
        expect(nextSlot.data()?.status).to.equal('reserved');
        expect(previousSlot.data()?.status).to.equal('available');
    });

    it('does not reserve slot when it is not available', async () => {
        await createSlots({
            reserved: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' }
        });
        await gift('other').set({ status: 'creating', slotId: 'reserved' });
        await gift('mine').set({ status: 'creating' });
        await db.collection('reservations').doc('new').set({ slotId: 'reserved', giftId: 'mine' });
        await sleep();

        let myGift = await gift('mine').get();
        let otherGift = await gift('other').get();
        let theSlot = await slot('reserved').get();

        expect(myGift.data()?.processedReservationId).to.equal('new');
        expect(myGift.data()?.slotId).to.be.undefined;
        expect(otherGift.data()?.slotId).to.equal('reserved')
        expect(theSlot.data()?.status).to.equal('reserved');
    });

    it('keeps previous reserved slot when the new one is not available', async () => {
        await createSlots({
            previous: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            next: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' }
        });
        await gift('mine').set({ status: 'creating', slotId: 'previous' });
        await db.collection('reservations').doc('new').set({ slotId: 'next', giftId: 'mine' });
        await sleep();

        let theGift = await gift('mine').get();
        let previousSlot = await slot('previous').get();
        let nextSlot = await slot('next').get();

        expect(theGift.data()?.processedReservationId).to.equal('new');
        expect(theGift.data()?.slotId).to.equal('previous');
        expect(previousSlot.data()?.status).to.equal('reserved')
        expect(nextSlot.data()?.status).to.equal('reserved');
    });

    it('does nothing when the slot does not exist', async () => {
        await gift('mine').set({ status: 'creating' });
        await db.collection('reservations').doc('new').set({ slotId: 'nosuch', giftId: 'mine' });
        await sleep();

        let theGift = await gift('mine').get();

        expect(theGift.data()?.processedReservationId).to.equal('new');
        expect(theGift.data()?.slotId).to.be.undefined;
    });

    it('reserves a free slot for exactly one of 2 concurrent reservations', async () => {
        await createSlots({
            free: { status: 'available', date: '20200726', time: '12:00', region: 'South' }
        });
        await gift('gOne').set({ status: 'creating' });
        await gift('gTwo').set({ status: 'creating' });
        let r1 = db.collection('reservations').doc('rOne').set({ slotId: 'free', giftId: 'gOne' });
        let r2 = db.collection('reservations').doc('rTwo').set({ slotId: 'free', giftId: 'gTwo' });
        await Promise.all([r1, r2]);
        await sleep();

        let giftOne = await gift('gOne').get();
        let giftTwo = await gift('gTwo').get();
        let theSlot = await slot('free').get();

        expect(giftOne.data()?.processedReservationId).to.equal('rOne');
        expect(giftTwo.data()?.processedReservationId).to.equal('rTwo');
        if (giftOne.data()?.slotId === 'free') {
            expect(giftTwo.data()?.slotId).to.be.undefined;
        } else if (giftTwo.data()?.slotId === 'free') {
            expect(giftOne.data()?.slotId).to.be.undefined;
        } else {
            fail('Neither of the gifts got the slot');
        }
        expect(theSlot.data()?.status).to.equal('reserved');
    });

    it('reserves a free slot for exactly one of 20 concurrent reservations', async function () {
        this.timeout(20000);

        await createSlots({
            free: { status: 'available', date: '20200726', time: '12:00', region: 'South' }
        });
        for (let i = 0; i < 20; i++) {
            await gift(`g${i}`).set({ status: 'creating' });
        }
        let rCreations: Promise<any>[] = [];
        for (let i = 0; i < 20; i++) {
            rCreations.push(db.collection('reservations').doc(`r${i}`).set({ slotId: 'free', giftId: `g${i}` }));
        }
        await Promise.all(rCreations);
        await sleep(10000);

        let gifts = [];
        for (let i = 0; i < 20; i++) {
            gifts.push(await gift(`g${i}`).get());
        }
        let theSlot = await slot('free').get();

        for (let i = 0; i < 20; i++) {
            expect(gifts[i].data()?.processedReservationId).to.equal(`r${i}`);
        }
        let giftsWithSlot = gifts.filter(g => g.data()?.slotId === 'free');
        expect(giftsWithSlot.length).to.equal(1);
        expect(theSlot.data()?.status).to.equal('reserved');
    });

    it('reserves 100 free slots for 100 concurrent reservations', async function () {
        this.timeout(30000);

        let batchCreate = db.batch();
        for (let i = 0; i < 100; i++) {
            batchCreate.set(slot(`s${i}`), { status: 'available', date: '20200726', time: '12:00', region: 'South' });
            batchCreate.set(gift(`g${i}`), { status: 'creating' });
        }
        await batchCreate.commit();

        let batchReserve = db.batch();
        for (let i = 0; i < 100; i++) {
            batchReserve.set(db.collection('reservations').doc(`r${i}`), { slotId: `s${i}`, giftId: `g${i}` });
        }
        await batchReserve.commit();
        await sleep(10000);

        for (let i = 0; i < 100; i++) {
            let aGift = await gift(`g${i}`).get();
            let aSlot = await slot(`s${i}`).get();

            expect(aGift.data()?.processedReservationId).to.equal(`r${i}`);
            expect(aGift.data()?.slotId).to.equal(`s${i}`);
            expect(aSlot.data()?.status).to.equal('reserved');
        }
    });

    it('releases slots reserved more than 15 minutes ago when still in creating state', async () => {
        await createSlots({
            one: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '13:00', region: 'South' }
        });
        await gift('fresh').set({ status: 'creating', slotId: 'one', reservedUntil: Date.now() + 5 * 60 * 1000 });
        await gift('expired').set({ status: 'creating', slotId: 'two', reservedUntil: Date.now() - 3 * 1000 });
        await gift('keep').set({ status: 'creating', slotId: 'three', reservedUntil: Date.now() - 3 * 1000 });
        await gift('keep').set({ status: 'pending' }, { merge: true });

        await functions.expireUnfinished();
        await sleep();

        let freshGift = await gift('fresh').get();
        let expiredGift = await gift('expired').get();
        let keepGift = await gift('keep').get();

        let slotOne = await slot('one').get();
        let slotTwo = await slot('two').get();
        let slotThree = await slot('three').get();

        expect(freshGift.data()?.slotId).to.equal('one');
        expect(expiredGift.data()?.slotId).to.be.undefined;
        expect(keepGift.data()?.slotId).to.equal('three');

        expect(slotOne.data()?.status).to.equal('reserved');
        expect(slotTwo.data()?.status).to.equal('available');
        expect(slotThree.data()?.status).to.equal('reserved');
    });

    it('releases slot upon gift rejection', async () => {
        await createSlots({
            reserved: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' }
        });
        await gift('mine').set({ status: 'creating', slotId: 'reserved' });
        await gift('mine').set({ status: 'pending' }, { merge: true });

        await gift('mine').set({ status: 'rejected' }, { merge: true });
        await sleep();

        let theSlot = await slot('reserved').get();
        expect(theSlot.data()?.status).to.equal('available');
    });

    it('releases slot upon gift cancellation', async () => {
        await createSlots({
            reserved: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' }
        });
        await gift('mine').set({ status: 'creating', slotId: 'reserved' });
        await gift('mine').set({ status: 'pending' }, { merge: true });

        await gift('mine').set({ status: 'cancelled' }, { merge: true });
        await sleep();

        let theSlot = await slot('reserved').get();
        expect(theSlot.data()?.status).to.equal('available');
    });

    it('releases slot upon gift deletion', async () => {
        await createSlots({
            reserved: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' }
        });
        await gift('mine').set({ status: 'creating', slotId: 'reserved' });

        await gift('mine').delete()
        await sleep();

        let theSlot = await slot('reserved').get();
        expect(theSlot.data()?.status).to.equal('available');
    });

    it('does not release slot upon gift deletion if it was later reserved for another gift', async function () {
        this.timeout(30000);

        await createSlots({
            reserved: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' }
        });
        await gift('mine').set({ status: 'creating', slotId: 'reserved' });
        await gift('mine').set({ status: 'pending' }, { merge: true });
        await gift('mine').set({ status: 'cancelled' }, { merge: true });
        await sleep();

        await gift('other').set({ status: 'creating', slotId: 'reserved' });
        await slot('reserved').set({ status: 'reserved' }, { merge: true });
        await sleep();

        await gift('mine').delete()
        await sleep();

        let theSlot = await slot('reserved').get();
        expect(theSlot.data()?.status).to.equal('reserved');
    });

});

describe('artist itineraries', function () {
    this.timeout(10000);

    beforeEach(async () => {
        await clearDatabase();
        await sleep();
    });

    it('single artist gets all gifts from a region when assigned', async () => {
        await createSlots({
            one: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '13:00', region: 'South' }
        });
        await createGifts({
            one: { slotId: 'one', status: 'confirmed' },
            two: { slotId: 'two', status: 'confirmed' },
            three: { slotId: 'three', status: 'confirmed' },
        });

        await db.collection('artists').doc('a').set({
            name: 'A',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '10:00' }, to: { date: '20200726', time: '16:00' } }
            ]
        });
        await sleep();


        let artist = await db.collection('artists').doc('a').get();
        expect(artist.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' },
            { slotId: 'two', giftId: 'two' },
            { slotId: 'three', giftId: 'three' },
        ])

    });

    it('is inclusive of itinerary start time, and exclusive of itinerary end time', async () => {
        await createSlots({
            one: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '13:00', region: 'South' }
        });
        await createGifts({
            one: { slotId: 'one', status: 'confirmed' },
            two: { slotId: 'two', status: 'confirmed' },
            three: { slotId: 'three', status: 'confirmed' },
        });

        await db.collection('artists').doc('a').set({
            name: 'A',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '12:00' }, to: { date: '20200726', time: '13:00' } }
            ]
        });
        await sleep();


        let artist = await db.collection('artists').doc('a').get();
        expect(artist.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' },
            { slotId: 'two', giftId: 'two' },
        ])
    });

    it('two artists get gifts evenly distributed when both assigned', async () => {
        await createSlots({
            one: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '13:00', region: 'South' }
        });
        await createGifts({
            one: { slotId: 'one', status: 'confirmed' },
            two: { slotId: 'two', status: 'confirmed' },
            three: { slotId: 'three', status: 'confirmed' },
        });

        await db.collection('artists').doc('a').set({
            name: 'A',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '15:00' } }
            ]
        });
        await db.collection('artists').doc('b').set({
            name: 'B',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '15:00' } }
            ]
        });
        await sleep();


        let artistA = await db.collection('artists').doc('a').get();
        let artistB = await db.collection('artists').doc('b').get();

        expect(artistA.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' },
            { slotId: 'three', giftId: 'three' },
        ])
        expect(artistB.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'two', giftId: 'two' },
        ])
    });

    it('three artists get gifts evenly distributed when all assigned', async () => {
        await createSlots({
            one: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '13:00', region: 'South' },
            four: { status: 'reserved', date: '20200726', time: '13:30', region: 'South' },
            five: { status: 'reserved', date: '20200726', time: '14:00', region: 'South' },
            six: { status: 'reserved', date: '20200726', time: '14:30', region: 'South' },
            seven: { status: 'reserved', date: '20200726', time: '15:00', region: 'South' },
            eight: { status: 'reserved', date: '20200726', time: '15:30', region: 'South' }
        });
        await createGifts({
            one: { slotId: 'one', status: 'confirmed' },
            two: { slotId: 'two', status: 'confirmed' },
            three: { slotId: 'three', status: 'confirmed' },
            four: { slotId: 'four', status: 'confirmed' },
            five: { slotId: 'five', status: 'confirmed' },
            six: { slotId: 'six', status: 'confirmed' },
            seven: { slotId: 'seven', status: 'confirmed' },
            eight: { slotId: 'eight', status: 'confirmed' },
        });

        await db.collection('artists').doc('a').set({
            name: 'A',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '16:00' } }
            ]
        });
        await db.collection('artists').doc('b').set({
            name: 'B',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '16:00' } }
            ]
        });
        await db.collection('artists').doc('c').set({
            name: 'C',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '16:00' } }
            ]
        });
        await sleep();


        let artistA = await db.collection('artists').doc('a').get();
        let artistB = await db.collection('artists').doc('b').get();
        let artistC = await db.collection('artists').doc('c').get();

        expect(artistA.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' },
            { slotId: 'four', giftId: 'four' },
            { slotId: 'seven', giftId: 'seven' },
        ])
        expect(artistB.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'two', giftId: 'two' },
            { slotId: 'five', giftId: 'five' },
            { slotId: 'eight', giftId: 'eight' },
        ])
        expect(artistC.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'three', giftId: 'three' },
            { slotId: 'six', giftId: 'six' },
        ])
    });

    it('three artists get gifts evenly distributed with partially overlapping assignments', async () => {
        await createSlots({
            one: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '13:00', region: 'South' },
            four: { status: 'reserved', date: '20200726', time: '13:30', region: 'South' },
            five: { status: 'reserved', date: '20200726', time: '14:00', region: 'South' },
            six: { status: 'reserved', date: '20200726', time: '14:30', region: 'South' },
            seven: { status: 'reserved', date: '20200726', time: '15:00', region: 'South' },
            eight: { status: 'reserved', date: '20200726', time: '15:30', region: 'South' }
        });
        await createGifts({
            one: { slotId: 'one', status: 'confirmed' },
            two: { slotId: 'two', status: 'confirmed' },
            three: { slotId: 'three', status: 'confirmed' },
            four: { slotId: 'four', status: 'confirmed' },
            five: { slotId: 'five', status: 'confirmed' },
            six: { slotId: 'six', status: 'confirmed' },
            seven: { slotId: 'seven', status: 'confirmed' },
            eight: { slotId: 'eight', status: 'confirmed' },
        });

        await db.collection('artists').doc('a').set({
            name: 'A',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '14:00' } }
            ]
        });
        await db.collection('artists').doc('b').set({
            name: 'B',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '13:00' }, to: { date: '20200726', time: '16:00' } }
            ]
        });
        await db.collection('artists').doc('c').set({
            name: 'C',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '16:00' } }
            ]
        });
        await sleep();


        let artistA = await db.collection('artists').doc('a').get();
        let artistB = await db.collection('artists').doc('b').get();
        let artistC = await db.collection('artists').doc('c').get();

        expect(artistA.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' },
            { slotId: 'four', giftId: 'four' },
        ])
        expect(artistB.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'three', giftId: 'three' },
            { slotId: 'six', giftId: 'six' },
            { slotId: 'eight', giftId: 'eight' },
        ])
        expect(artistC.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'two', giftId: 'two' },
            { slotId: 'five', giftId: 'five' },
            { slotId: 'seven', giftId: 'seven' },

        ])
    });

    it('redistributes slots when gift is updated', async function () {
        this.timeout(20000);

        await createSlots({
            one: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '13:00', region: 'South' }
        });
        await createGifts({
            one: { slotId: 'one', status: 'confirmed' },
            two: { slotId: 'two', status: 'pending' },
            three: { slotId: 'three', status: 'confirmed' },
        });

        await db.collection('artists').doc('a').set({
            name: 'A',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '15:00' } }
            ]
        });
        await db.collection('artists').doc('b').set({
            name: 'B',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '15:00' } }
            ]
        });
        await sleep();


        let artistA = await db.collection('artists').doc('a').get();
        let artistB = await db.collection('artists').doc('b').get();
        expect(artistA.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' }
        ])
        expect(artistB.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'three', giftId: 'three' },
        ])

        await gift('two').set({ slotId: 'two', status: 'confirmed' });
        await sleep();

        artistA = await db.collection('artists').doc('a').get();
        artistB = await db.collection('artists').doc('b').get();
        expect(artistA.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' },
            { slotId: 'three', giftId: 'three' }
        ])
        expect(artistB.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'two', giftId: 'two' },
        ])
    });

    it('redistributes slots when gift is deleted', async function () {
        this.timeout(20000);

        await createSlots({
            one: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '13:00', region: 'South' }
        });
        await createGifts({
            one: { slotId: 'one', status: 'confirmed' },
            two: { slotId: 'two', status: 'confirmed' },
            three: { slotId: 'three', status: 'confirmed' },
        });

        await db.collection('artists').doc('a').set({
            name: 'A',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '15:00' } }
            ]
        });
        await db.collection('artists').doc('b').set({
            name: 'B',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '15:00' } }
            ]
        });
        await sleep();


        let artistA = await db.collection('artists').doc('a').get();
        let artistB = await db.collection('artists').doc('b').get();
        expect(artistA.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' },
            { slotId: 'three', giftId: 'three' }
        ])
        expect(artistB.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'two', giftId: 'two' },
        ])

        await gift('two').delete()
        await sleep();

        artistA = await db.collection('artists').doc('a').get();
        artistB = await db.collection('artists').doc('b').get();
        expect(artistA.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' },
        ])
        expect(artistB.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'three', giftId: 'three' },
        ])
    });

    it('redistributes slots when artist itinerary is added', async function () {
        this.timeout(20000);

        await createSlots({
            one: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '13:00', region: 'South' }
        });
        await createGifts({
            one: { slotId: 'one', status: 'confirmed' },
            two: { slotId: 'two', status: 'confirmed' },
            three: { slotId: 'three', status: 'confirmed' },
        });

        await db.collection('artists').doc('a').set({
            name: 'A',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '15:00' } }
            ]
        });
        await db.collection('artists').doc('b').set({
            name: 'B',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '12:00' } }
            ]
        });
        await sleep();


        let artistA = await db.collection('artists').doc('a').get();
        let artistB = await db.collection('artists').doc('b').get();
        expect(artistA.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' },
            { slotId: 'two', giftId: 'two' },
            { slotId: 'three', giftId: 'three' }
        ])
        expect(artistB.data()!.itineraries[0].assignments).to.deep.equal([
        ])

        await db.collection('artists').doc('b').set({
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '12:00' } },
                { region: 'South', from: { date: '20200726', time: '12:00' }, to: { date: '20200726', time: '16:00' } }
            ]
        }, { merge: true });
        await sleep();

        artistA = await db.collection('artists').doc('a').get();
        artistB = await db.collection('artists').doc('b').get();
        expect(artistA.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' },
            { slotId: 'three', giftId: 'three' }
        ])
        expect(artistB.data()!.itineraries[1].assignments).to.deep.equal([
            { slotId: 'two', giftId: 'two' },
        ])
    });

    it('redistributes slots when artist itinerary is deleted', async function () {
        this.timeout(20000);

        await createSlots({
            one: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '13:00', region: 'South' }
        });
        await createGifts({
            one: { slotId: 'one', status: 'confirmed' },
            two: { slotId: 'two', status: 'confirmed' },
            three: { slotId: 'three', status: 'confirmed' },
        });

        await db.collection('artists').doc('a').set({
            name: 'A',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '15:00' } }
            ]
        });
        await db.collection('artists').doc('b').set({
            name: 'B',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '12:00' } },
                { region: 'South', from: { date: '20200726', time: '12:00' }, to: { date: '20200726', time: '16:00' } }
            ]
        });
        await sleep();


        let artistA = await db.collection('artists').doc('a').get();
        let artistB = await db.collection('artists').doc('b').get();
        expect(artistA.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' },
            { slotId: 'three', giftId: 'three' }
        ])
        expect(artistB.data()!.itineraries[1].assignments).to.deep.equal([
            { slotId: 'two', giftId: 'two' },
        ])

        await db.collection('artists').doc('b').set({
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '12:00' } },
            ]
        }, { merge: true });
        await sleep();

        artistA = await db.collection('artists').doc('a').get();
        artistB = await db.collection('artists').doc('b').get();
        expect(artistA.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' },
            { slotId: 'two', giftId: 'two' },
            { slotId: 'three', giftId: 'three' }
        ])
        expect(artistB.data()!.itineraries[0].assignments).to.deep.equal([
        ])
    });

    it('redistributes slots when artist is deleted', async function () {
        this.timeout(20000);

        await createSlots({
            one: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '13:00', region: 'South' }
        });
        await createGifts({
            one: { slotId: 'one', status: 'confirmed' },
            two: { slotId: 'two', status: 'confirmed' },
            three: { slotId: 'three', status: 'confirmed' },
        });

        await db.collection('artists').doc('a').set({
            name: 'A',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '15:00' } }
            ]
        });
        await db.collection('artists').doc('b').set({
            name: 'B',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '15:00' } }
            ]
        });
        await sleep();


        let artistA = await db.collection('artists').doc('a').get();
        let artistB = await db.collection('artists').doc('b').get();
        expect(artistA.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' },
            { slotId: 'three', giftId: 'three' }
        ])
        expect(artistB.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'two', giftId: 'two' },
        ])

        await db.collection('artists').doc('b').delete()
        await sleep();

        artistA = await db.collection('artists').doc('a').get();
        artistB = await db.collection('artists').doc('b').get();
        expect(artistA.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' },
            { slotId: 'two', giftId: 'two' },
            { slotId: 'three', giftId: 'three' }
        ])
    });

    it('does not redistribute slots when appstate is post', async function () {
        this.timeout(20000);

        await createSlots({
            one: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '13:00', region: 'South' }
        });
        await createGifts({
            one: { slotId: 'one', status: 'confirmed' },
            two: { slotId: 'two', status: 'pending' },
            three: { slotId: 'three', status: 'confirmed' },
        });

        await db.collection('artists').doc('a').set({
            name: 'A',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '15:00' } }
            ]
        });
        await db.collection('artists').doc('b').set({
            name: 'B',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '15:00' } }
            ]
        });
        await sleep();


        let artistA = await db.collection('artists').doc('a').get();
        let artistB = await db.collection('artists').doc('b').get();
        expect(artistA.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' }
        ])
        expect(artistB.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'three', giftId: 'three' },
        ])

        await db.collection('appstates').doc('singleton').set({ state: 'post' });
        await gift('two').set({ slotId: 'two', status: 'confirmed' });
        await sleep();

        artistA = await db.collection('artists').doc('a').get();
        artistB = await db.collection('artists').doc('b').get();
        expect(artistA.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' }
        ])
        expect(artistB.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'three', giftId: 'three' },
        ])
    });

    it('excludes gifts in rejected and cancelled status', async function () {
        await createSlots({
            one: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '13:00', region: 'South' }
        });
        await createGifts({
            one: { slotId: 'one', status: 'rejected' },
            two: { slotId: 'two', status: 'confirmed' },
            three: { slotId: 'three', status: 'cancelled' },
        });

        await db.collection('artists').doc('a').set({
            name: 'A',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '10:00' }, to: { date: '20200726', time: '16:00' } }
            ]
        });
        await sleep();


        let artist = await db.collection('artists').doc('a').get();
        expect(artist.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'two', giftId: 'two' },
        ])
    });

    it('excludes gifts in pending and created status', async function () {
        await createSlots({
            one: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '13:00', region: 'South' }
        });
        await createGifts({
            one: { slotId: 'one', status: 'pending' },
            two: { slotId: 'two', status: 'confirmed' },
            three: { slotId: 'three', status: 'creating' },
        });

        await db.collection('artists').doc('a').set({
            name: 'A',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '10:00' }, to: { date: '20200726', time: '16:00' } }
            ]
        });
        await sleep();


        let artist = await db.collection('artists').doc('a').get();
        expect(artist.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'two', giftId: 'two' },
        ])
    });

    it('slots in different regions are processed independently', async () => {
        await createSlots({
            one: { status: 'reserved', date: '20200726', time: '12:00', region: 'South' },
            two: { status: 'reserved', date: '20200726', time: '12:30', region: 'South' },
            three: { status: 'reserved', date: '20200726', time: '13:00', region: 'South' },
            four: { status: 'reserved', date: '20200726', time: '12:00', region: 'North' },
            five: { status: 'reserved', date: '20200726', time: '12:30', region: 'North' },
            six: { status: 'reserved', date: '20200726', time: '13:00', region: 'North' },
            seven: { status: 'reserved', date: '20200726', time: '12:00', region: 'West' },
            eight: { status: 'reserved', date: '20200726', time: '12:30', region: 'West' },
            nine: { status: 'reserved', date: '20200726', time: '13:00', region: 'West' }

        });
        await createGifts({
            one: { slotId: 'one', status: 'confirmed' },
            two: { slotId: 'two', status: 'confirmed' },
            three: { slotId: 'three', status: 'confirmed' },
            four: { slotId: 'four', status: 'confirmed' },
            five: { slotId: 'five', status: 'confirmed' },
            six: { slotId: 'six', status: 'confirmed' },
            seven: { slotId: 'seven', status: 'confirmed' },
            eight: { slotId: 'eight', status: 'confirmed' },
            nine: { slotId: 'nine', status: 'confirmed' },
        });

        await db.collection('artists').doc('a').set({
            name: 'A',
            itineraries: [
                { region: 'South', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '13:00' } },
                { region: 'North', from: { date: '20200726', time: '13:00' }, to: { date: '20200726', time: '14:00' } }
            ]
        });
        await db.collection('artists').doc('b').set({
            name: 'B',
            itineraries: [
                { region: 'North', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '13:00' } },
                { region: 'West', from: { date: '20200726', time: '13:00' }, to: { date: '20200726', time: '14:00' } }
            ]
        });
        await db.collection('artists').doc('c').set({
            name: 'C',
            itineraries: [
                { region: 'West', from: { date: '20200726', time: '11:00' }, to: { date: '20200726', time: '13:00' } },
                { region: 'South', from: { date: '20200726', time: '13:00' }, to: { date: '20200726', time: '14:00' } }
            ]
        });
        await sleep();


        let artistA = await db.collection('artists').doc('a').get();
        let artistB = await db.collection('artists').doc('b').get();
        let artistC = await db.collection('artists').doc('c').get();

        expect(artistA.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'one', giftId: 'one' },
            { slotId: 'two', giftId: 'two' },
        ])
        expect(artistA.data()!.itineraries[1].assignments).to.deep.equal([
            { slotId: 'six', giftId: 'six' }
        ])
        expect(artistB.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'four', giftId: 'four' },
            { slotId: 'five', giftId: 'five' }
        ])
        expect(artistB.data()!.itineraries[1].assignments).to.deep.equal([
            { slotId: 'nine', giftId: 'nine' }
        ])
        expect(artistC.data()!.itineraries[0].assignments).to.deep.equal([
            { slotId: 'seven', giftId: 'seven' },
            { slotId: 'eight', giftId: 'eight' }
        ])
        expect(artistC.data()!.itineraries[1].assignments).to.deep.equal([
            { slotId: 'three', giftId: 'three' }
        ])
    });

});

async function sleep(t = 7000) {
    return new Promise(res => setTimeout(res, t));
}

async function clearDatabase() {
    let appStates = db.collection('appstates');
    let admins = db.collection('admins');
    let messages = db.collection('messages');
    let gifts = db.collection('gifts');
    let slots = db.collection('slots');
    let reservations = db.collection('reservations');
    let artists = db.collection('artists');

    await messages.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));
    await reservations.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));
    await gifts.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));
    await slots.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));
    await artists.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));
    await admins.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));
    await appStates.listDocuments().then(docs => Promise.all(docs.map(d => d.delete())));
}

async function createSlots(slots: { [id: string]: any }) {
    let batch = db.batch();
    for (let id of Object.keys(slots)) {
        batch.set(db.collection('slots').doc(id), slots[id]);
    }
    await batch.commit();
}

async function createGifts(gifts: { [id: string]: any }) {
    let batch = db.batch();
    for (let id of Object.keys(gifts)) {
        batch.set(db.collection('gifts').doc(id), gifts[id]);
    }
    await batch.commit();
}

function slot(id: string) {
    return db.collection('slots').doc(id);
}

function gift(id: string) {
    return db.collection('gifts').doc(id);
}