import { ASSetContent, ASSetMember } from 'src/core/IRR/AS_SET';
import { Content } from '../content';

describe('easy content member', () => {
    test('returns empty ASSetContent when no members are provided', async () => {
        const content = new Content('empty', []);

        const result = await content.toASSetContent();

        expect(result).toBeInstanceOf(ASSetContent);
        expect(result.members).toHaveLength(0);
    });

    test('unions all member contents from async and sync providers', async () => {
        const memberA = {
            type: 'AS_NUMBER' as const,
            toASSetContent: () =>
                new ASSetContent([new ASSetMember('AS65001', 'undetermined')]),
        };

        const memberB = {
            type: 'AS_SET' as const,
            toASSetContent: async () =>
                new ASSetContent([
                    new ASSetMember('AS65002', 'undetermined'),
                    new ASSetMember('AS65001', 'undetermined'),
                ]),
        };

        const content = new Content('mixed', [memberA, memberB]);

        const result = await content.toASSetContent();

        expect(result.members).toHaveLength(2);
        expect(result.has(65001)).toBe(true);
        expect(result.has(65002)).toBe(true);
    });
});
