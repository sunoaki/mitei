import { assertValid, contentSchema } from '../schema';

describe('easyirr schema assertions', () => {
    test('assertValid accepts correct content shape', () => {
        const valid = {
            name: 'good-content',
            members: ['AS65001', 65002],
        };

        expect(() =>
            assertValid(contentSchema, valid, 'content format'),
        ).not.toThrow();
    });

    test('assertValid reports path when schema fails', () => {
        const invalid = {
            name: 'bad-content',
            members: [{}],
        };

        expect(() =>
            assertValid(contentSchema, invalid, 'content format'),
        ).toThrow(/Invalid content format: \$.+/);
    });
});
