import BigNumber from 'bignumber.js';
import { AccountsFlow, AccountsFlows, Balance, Flow, Time } from './typings';

export const parsePoolBalances = (
    flows: Flow[],
    balancesStart: Balance,
): Balance[] => {
    const balances = [balancesStart];
    let lastBalances = balancesStart;
    flows.forEach((flow) => {
        const newBalances: Balance = [
            BigNumber(lastBalances[0])
                .plus(flow.in[0])
                .minus(flow.out[0])
                .toNumber(),
            BigNumber(lastBalances[1])
                .plus(flow.in[1])
                .minus(flow.out[1])
                .toNumber(),
        ];
        balances.push(newBalances);
        lastBalances = newBalances;
    });
    return balances;
};

export const parseTimes = (flows: Flow[]): Time[] =>
    flows.map((flow) => ({
        timestamp: new Date(flow.timestamp * 1000),
        block: flow.block,
        logIndex: flow.logIndex,
    }));

export const parseExchangeRate = (balance: Balance): BigNumber =>
    BigNumber(balance[0]).div(balance[1]);

export const parseInvariant = (balance: Balance): BigNumber =>
    BigNumber(balance[0]).times(balance[1]);

export const parseMaxAccountFlows = (
    accountsFlows: AccountsFlows,
): [number, number] => {
    const lastFlows = accountsFlows[accountsFlows.length - 1];
    const max = lastFlows.reduce<[BigNumber, BigNumber]>(
        (max, flow) => {
            const max0 = BigNumber.max(max[0], flow.in[0], flow.out[0]);
            const max1 = BigNumber.max(max[1], flow.in[1], flow.out[1]);
            return [max0, max1];
        },
        [BigNumber(0), BigNumber(0)],
    );
    return [max[0].toNumber(), max[1].toNumber()];
};

export const parseMaxFlows = (flows: Flow[]): [number, number] => {
    const max = flows.reduce<[BigNumber, BigNumber]>(
        (max, flow) => {
            const max0 = BigNumber.max(max[0], flow.in[0], flow.out[0]);
            const max1 = BigNumber.max(max[1], flow.in[1], flow.out[1]);
            return [max0, max1];
        },
        [BigNumber(0), BigNumber(0)],
    );
    return [max[0].toNumber(), max[1].toNumber()];
};

export const parseAddresses = (flows: Flow[]) => {
    const addresses = new Set<string>();
    flows.forEach((f) => {
        if (f.sender) {
            addresses.add(f.sender);
        }
        if (f.recipient) {
            addresses.add(f.recipient);
        }
    });
    const sortedAddresses = Array.from(addresses).sort();
    console.log(
        `Got ${sortedAddresses.length} addresses from ${flows.length} flows`,
    );
    return sortedAddresses;
};

export const shortenAddress = (address: string) =>
    address.slice(0, 6) + '..' + address.slice(-4);

export const shortenAddresses = (addresses: string[]) => {
    return addresses.map((a) => shortenAddress(a));
};

export const parseAccountsFlows = (
    flows: Flow[],
): {
    accountsFlows: AccountsFlows;
    accounts: string[];
} => {
    const accounts = parseAddresses(flows);

    // Initialize accountsFlows to zero in and out for each account
    let lastAccountsFlow: AccountsFlow = accounts.map(() => ({
        in: [0, 0],
        out: [0, 0],
    }));
    const accountsFlows: AccountsFlows = [lastAccountsFlow];

    // For each flow
    flows.forEach((flow) => {
        const newAccountsFlow: AccountsFlow = [];
        // For each account
        accounts.forEach((account, index) => {
            if (account === flow.sender) {
                newAccountsFlow.push({
                    in: [
                        BigNumber(lastAccountsFlow[index].in[0])
                            .plus(+flow.in[0])
                            .toNumber(),
                        BigNumber(lastAccountsFlow[index].in[1])
                            .plus(flow.in[1])
                            .toNumber(),
                    ],
                    out: [
                        BigNumber(lastAccountsFlow[index].out[0])
                            .plus(+flow.out[0])
                            .toNumber(),
                        BigNumber(lastAccountsFlow[index].out[1])
                            .plus(flow.out[1])
                            .toNumber(),
                    ],
                });
            } else {
                newAccountsFlow.push(lastAccountsFlow[index]);
            }
        });

        accountsFlows.push(newAccountsFlow);
        lastAccountsFlow = newAccountsFlow;
    });

    return { accounts, accountsFlows };
};
