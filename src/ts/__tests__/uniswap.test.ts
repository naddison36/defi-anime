/**
 * @jest-environment jsdom
 */

import { Flow } from '../typings';
import { getFlows, getReserves } from '../uniswap';

describe('Uniswap', () => {
    describe('getFlows', () => {
        let flows: Flow[];
        beforeAll(async () => {
            flows = await getFlows(
                '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
                1680244823,
                1680277331,
            );
        });
        it('should return ETH/USDC flows', async () => {
            expect(flows).toHaveLength(164);
            expect(flows.filter((f) => f.type === 'Swap')).toHaveLength(147);
            expect(flows.filter((f) => f.type === 'Mint')).toHaveLength(5);
            expect(flows.filter((f) => f.type === 'Burn')).toHaveLength(12);
        });
    });
});
describe('get reserves', () => {
    it('should get ETH/USDC reserves', async () => {
        const reserves = await getReserves(
            '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
            16945463 - 1,
        );
        expect(reserves[0]).toEqual(174605996.497346);
        expect(reserves[1]).toEqual(79357.50353578203);
    });
});
