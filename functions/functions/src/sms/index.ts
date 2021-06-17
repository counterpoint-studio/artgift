//import { sendSMS as twilioSendSMS } from "./twilioSMSSender";
//import { sendSMS as tekstariFiSendSMS } from "./tekstariFiSMSSender";

// Default SMS Sender: do nothing
export const sendSMS = async (message: string, toNumber: string) => {};

// Twilio SMS API, uncomment to enable
// export const sendSMS = twilioSendSMS;

// Finnish tekstari.fi SMS API, uncomment to enable
// export const sendSMS = tekstariFiSendSMS;
