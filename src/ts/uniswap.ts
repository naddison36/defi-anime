import { Balance, Flow } from './typings';

const uniswapUrl = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';

export const getReserves = async (
    poolAddress: string,
    block: number,
): Promise<Balance> => {
    const query = `
          query {
            pool(id: "${poolAddress}", block: {number: ${block}}) {
              totalValueLockedToken0
              totalValueLockedToken1
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
        parseFloat(result.data.pool.totalValueLockedToken0),
        parseFloat(result.data.pool.totalValueLockedToken1),
    ];
    console.log(`reserves at block ${block}: ${reserves}`);
    return reserves;
};

export const getFlows = async (
    poolAddress: string,
    startTime: number,
    endTime: number,
): Promise<Flow[]> => {
    const query = `
    {
        swaps(
          where: {
            pool: "${poolAddress}"
            timestamp_gte: ${startTime}
            timestamp_lte: ${endTime}
          },
          orderBy : transaction__blockNumber
          orderDirection: asc,
          first: 1000
        ) {
          amount0
          amount0
          timestamp
          sender
          logIndex
          transaction {
            blockNumber
          }
        },
        mints(
          where: {
            pool: "${poolAddress}"
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
            pool: "${poolAddress}"
            timestamp_gte: ${startTime}
            timestamp_lte: ${endTime}
          },
          orderBy : transaction__blockNumber
          orderDirection: asc, 
        ) {
            amount0
            amount1
            timestamp
            owner
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

    const swapFlows = result.data.swaps.map((s: any) => {
        const amount0 = parseFloat(s.amount0);
        const amount1 = parseFloat(s.amount1);
        const inFlow = [amount0 >= 0 ? amount0 : 0, amount1 >= 0 ? amount1 : 0];
        const outFlow = [
            amount0 < 0 ? -1 * amount0 : 0,
            amount1 < 0 ? -1 * amount1 : 0,
        ];
        return {
            type: 'Swap',
            in: inFlow,
            out: outFlow,
            timestamp: s.timestamp,
            sender: s.sender,
            logIndex: parseInt(s.logIndex),
            block: parseInt(s.transaction.blockNumber),
        };
    });
    const mintFlows = result.data.mints.map((m: any) => ({
        type: 'Mint',
        in: [parseFloat(m.amount0), parseFloat(m.amount1)],
        out: [0, 0],
        timestamp: m.timestamp,
        sender: m.sender,
        logIndex: parseInt(m.logIndex),
        block: parseInt(m.transaction.blockNumber),
    }));
    const burnFlows = result.data.burns.map((b: any) => ({
        type: 'Burn',
        in: [0, 0],
        out: [parseFloat(b.amount0), parseFloat(b.amount1)],
        timestamp: b.timestamp,
        sender: b.owner,
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
