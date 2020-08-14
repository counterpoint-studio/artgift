import * as functions from 'firebase-functions';
import mandrill from 'mandrill-api';

export function sendEmail(subject: string, body: string, toEmail: string, toName: string) {
    let cfg = functions.config();
    let fromEmail = cfg.artgift.emailapi.fromaddress;
    let fromName = cfg.artgift.emailapi.fromname;
    let mandrillClient = new mandrill.Mandrill(functions.config().artgift.emailapi.apikey);
    return new Promise((res) => mandrillClient.messages.send({
        message: {
            subject,
            html: body,
            from_email: fromEmail,
            from_name: fromName,
            to: [{
                email: toEmail,
                name: toName,
                type: 'to'
            }],
            auto_text: true
        }
    }, result => {
        console.log('Email API response', result, 'for request', {
            message: {
                subject,
                html: body,
                from_email: fromEmail,
                from_name: fromName,
                to: [{
                    email: toEmail,
                    name: toName,
                    type: 'to'
                }],
                auto_text: true
            }
        });
        res();
    }));
}
