export type AccessControlErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN';

export class AccessControlError extends Error {
    public readonly code: AccessControlErrorCode;

    constructor(code: AccessControlErrorCode, message: string) {
        super(message);
        this.code = code;
        this.name = 'AccessControlError';
    }
}
