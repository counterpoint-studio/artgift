import * as functions from "firebase-functions";
import twilio from "twilio";

export function sendSMS(message: string, toNumber: string) {
  let cfg = functions.config();
  let client = twilio(
    cfg.artgift.smsapi.accountsid,
    cfg.artgift.smsapi.authtoken
  );
  client.api.messages
    .create({
      body: message,
      to: normalisePhoneNumber(toNumber),
      from: "Taidelahja",
    })
    .then((data) => {
      console.log("Twilio res", data);
    })
    .catch((err) => {
      console.error("Twilio err", err);
    });
}

function normalisePhoneNumber(number: string) {
  number = number.replace(/\s+/g, "");
  if (number.startsWith("0")) {
    return "+358" + number.substring(1);
  } else if (number.startsWith("358")) {
    return "+" + number;
  } else {
    return number;
  }
}
