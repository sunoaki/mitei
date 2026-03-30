import { execFileSync } from 'node:child_process';

function getStagedFiles() {
    const output = execFileSync(
        'git',
        ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
        {
            encoding: 'utf8',
        },
    ).trim();

    if (!output) return [];

    return output
        .split('\n')
        .map((file) => file.trim())
        .filter(Boolean)
        .filter((file) => /\.(ts|tsx|js|mjs|cjs)$/.test(file));
}

const files = getStagedFiles();

if (files.length === 0) {
    console.log('No staged JS/TS files. Skipping related tests.');
    process.exit(0);
}

execFileSync('yarn', ['jest', '--findRelatedTests', ...files, '--passWithNoTests'], {
    stdio: 'inherit',
});
