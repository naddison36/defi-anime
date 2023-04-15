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

export interface Time {
    timestamp: Date;
    block: number;
    logIndex: number;
}

// Token flow in and out of the pool over time.
export interface AccountFlow {
    in: [number, number];
    out: [number, number];
}

// An array of AccountFlow for every account.
// This is a point in time snapshot of each account's flows over time.
export declare type AccountsFlow = AccountFlow[];
// An array of AccountFlows for each time point
export declare type AccountsFlows = AccountsFlow[];

export interface Component {
    render: () => void;
    update: () => void;
}
