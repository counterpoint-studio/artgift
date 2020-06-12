export type Gift = {
    slotId?: string;
    toName: string;
    toAddress: string;
    toLocation?: [number, number];
    toLanguage: string;
    toSignificance: string;
    fromName: string;
    fromPhoneNumber: string;
    fromEmail: string;
    fromMessage: string;
}