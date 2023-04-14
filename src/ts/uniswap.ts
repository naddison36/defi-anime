import { Balance, Flow } from './typings';

const uniswapUrl =
    'https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2';

export const getReserves = async (
    pairAddress: string,
    block: number,
): Promise<Balance> => {
    const query = `
          query {
            pair(id: "${pairAddress}", block: {number: ${block}}) {
              reserve0
              reserve1
            }
          }
        `;

    const response = await fetch(uniswapUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
    });
    const result = await response.json();
    const reserves: [number, number] = [
        parseFloat(result.data.pair.reserve0),
        parseFloat(result.data.pair.reserve1),
    ];
    console.log(`reserves at block ${block}: ${reserves}`);
    return reserves;
};

export const getFlows = async (
    pairAddress: string,
    startTime: number,
    endTime: number,
): Promise<Flow[]> => {
    const query = `
    {
        swaps(
          where: {
            pair: "${pairAddress}"
            timestamp_gte: ${startTime}
            timestamp_lte: ${endTime}
          },
          orderBy : transaction__blockNumber
          orderDirection: asc,
          first: 1000
        ) {
          amount0In
          amount1In
          amount0Out
          amount1Out
          timestamp
          sender
          logIndex
          transaction {
            blockNumber
          }
        },
        mints(
          where: {
            pair: "${pairAddress}"
            timestamp_gte: ${startTime}
            timestamp_lte: ${endTime}
          },
          orderBy : transaction__blockNumber
          orderDirection: asc, 
        ) {
            amount0
            amount1
            timestamp
            sender
            logIndex
            transaction {
              blockNumber
            }
        },
        burns(
          where: {
            pair: "${pairAddress}"
            timestamp_gte: ${startTime}
            timestamp_lte: ${endTime}
          },
          orderBy : transaction__blockNumber
          orderDirection: asc, 
        ) {
            amount0
            amount1
            timestamp
            sender
            logIndex
            transaction {
              blockNumber
            }
        }
    }
`;
    const response = await fetch(uniswapUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
    });
    const result = await response.json();

    const swapFlows = result.data.swaps.map((s: any) => ({
        type: 'Swap',
        in: [s.amount0In, s.amount1In],
        out: [s.amount0Out, s.amount1Out],
        timestamp: s.timestamp,
        sender: s.sender,
        logIndex: parseInt(s.logIndex),
        block: parseInt(s.transaction.blockNumber),
    }));
    const mintFlows = result.data.mints.map((m: any) => ({
        type: 'Mint',
        in: [m.amount0, m.amount1],
        out: [0, 0],
        timestamp: m.timestamp,
        sender: m.sender,
        logIndex: parseInt(m.logIndex),
        block: parseInt(m.transaction.blockNumber),
    }));
    const burnFlows = result.data.burns.map((b: any) => ({
        type: 'Burn',
        in: [0, 0],
        out: [b.amount0, b.amount1],
        timestamp: b.timestamp,
        sender: b.sender,
        logIndex: parseInt(b.logIndex),
        block: parseInt(b.transaction.blockNumber),
    }));

    const orderedFlows = [...swapFlows, ...mintFlows, ...burnFlows].sort(
        (a, b) => {
            const aVale = parseInt(a.block) * 100000 + parseInt(a.logIndex);
            const bValue = parseInt(b.block) * 100000 + parseInt(b.logIndex);
            if (aVale < bValue) return -1;
            if (aVale > bValue) return 1;
            return 0;
        },
    );
    console.log(`${swapFlows.length} swaps`);
    console.log(`${mintFlows.length} mints`);
    console.log(`${burnFlows.length} burns`);

    return orderedFlows;
};
