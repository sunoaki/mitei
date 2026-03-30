import IRRContent from '../content';

describe('IRR base content', () => {
    test('initializes with empty description and remarks arrays', () => {
        const content = new IRRContent();

        expect(content.descriptions).toEqual([]);
        expect(content.remarks).toEqual([]);
    });

    test('toRPSL renders description and remarks lines', () => {
        const content = new IRRContent();
        content.descriptions = ['first description', 'second description'];
        content.remarks = ['first remark'];

        expect(content.toRPSL()).toBe(
            'description: first description\n' +
                'description: second description\n' +
                'remarks: first remark\n',
        );
    });

    test('toRPSL skips undefined description and remarks', () => {
        const content = new IRRContent();
        content.descriptions = undefined;
        content.remarks = undefined;

        expect(content.toRPSL()).toBe('');
    });

    test('loadFromRPSL parses description and remarks while ignoring other keys', () => {
        const loaded = IRRContent.loadFromRPSL(
            [
                'description: one',
                'source: RADB',
                'remarks: remark with : colon',
                'description: two',
            ].join('\n'),
        );

        expect(loaded.descriptions).toEqual(['one', 'two']);
        expect(loaded.remarks).toEqual(['remark with : colon']);
    });
});
