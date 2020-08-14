import * as functions from 'firebase-functions';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

export function sendSMS(message: string, toNumber: string) {
    let cfg = functions.config();
    let smsApiUrl = cfg.artgift.smsapi.url;
    let smsApiUsername = cfg.artgift.smsapi.username;
    let smsApiPassword = cfg.artgift.smsapi.password;
    let params = new URLSearchParams();
    params.append('sms_username', smsApiUsername);
    params.append('sms_password', smsApiPassword);
    params.append('sms_dest', normalisePhoneNumber(toNumber));
    params.append('sms_unicode', hexEncode(message));
    return fetch(smsApiUrl, {
        method: 'POST',
        body: params
    }).then(res => res.text()).then(resText => {
        let [status, message] = resText.split('\n');
        if (status === 'OK') {
            return true;
        } else {
            throw new Error('SMS API error: ' + message);
        }
    })
}

function normalisePhoneNumber(number: string) {
    number = number.replace(/\s+/g, '');
    if (number.startsWith('0')) {
        return '+358' + number.substring(1);
    } else if (number.startsWith('358')) {
        return '+' + number;
    } else {
        return number;
    }
}

function hexEncode(str: string) {
    let result = "";
    for (let i = 0; i < str.length; i++) {
        let hex = str.charCodeAt(i).toString(16);
        result += ("000" + hex).slice(-4);
    }
    return result
}