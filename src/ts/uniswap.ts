const uniswapUrl =
    'https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2';

export const getReserves = async (
    pairAddress: string,
    block: number,
): Promise<[number, number]> => {
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
