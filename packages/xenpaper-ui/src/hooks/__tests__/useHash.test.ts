import {hashify, unhashify} from '../useHash';

const TEXT = `
0 1 2 3 4 5 6 7 8 9 0-.
| 1\\1 1/1 1c 1Hz 1hz 3/1o3
'0 "0 \`0 [0,2] 0:2 (2)
{12edo}{r3}
# hi _ how are you     ...with spaces!
`;

const TEXT_NO_UNDERSCORES = `
0 1 2 3 4 5 6 7 8 9 0-.
| 1\\1 1/1 1c 1Hz 1hz 3/1o3
'0 "0 \`0 [0,2] 0:2 (2)
{12edo}{r3}
# hi how are you     ...with spaces!
`;

describe('hash', () => {
    it('should encrypt and decrypt hash', () => {
        expect(unhashify(hashify(TEXT))).toBe(TEXT);
    });

    it('should decrypt hash without underscores and get same result', () => {
        expect(unhashify(TEXT_NO_UNDERSCORES)).toBe(TEXT_NO_UNDERSCORES);
    });
});
