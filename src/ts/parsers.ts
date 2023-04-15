import BigNumber from 'bignumber.js';
import { Balance, Flow } from './typings';

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
