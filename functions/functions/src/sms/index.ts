// import { sendSMS as tekstariSendSMS } from './tekstariFiSMSSender';

// Default SMS Sender: do nothing
export const sendSMS = async (message: string, toNumber: string) => { }

// Finnish tekstari.fi SMS API, uncomment to enable
// export const sendSMS = tekstariSendSMS
