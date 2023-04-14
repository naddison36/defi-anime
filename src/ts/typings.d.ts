export declare type Balance = [number, number];

export interface Flow {
    type: 'Mint' | 'Burn' | 'Swap';
    in: [number, number];
    out: [number, number];
    timestamp: number;
    sender: string;
    recipient: string;
    logIndex: number;
    block: number;
}
