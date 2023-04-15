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
    describe('swap with sender != recipient', () => {
        let flows: Flow[];
        beforeAll(async () => {
            flows = await getFlows(
                '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
                1681507271,
                1681507271,
            );
        });
        it('flow should have sender and recipient', async () => {
            const firstFlow = flows[0];
            expect(firstFlow.sender).toEqual(
                '0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b',
            );
            expect(firstFlow.recipient).toEqual(
                '0x21bd72a7e219b836680201c25b61a4aa407f7bfd',
            );
            expect(firstFlow.in[0]).toEqual(0);
            expect(firstFlow.in[1]).toEqual(10);
            expect(firstFlow.out[0]).toEqual(21030.753542);
            expect(firstFlow.out[1]).toEqual(0);
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
