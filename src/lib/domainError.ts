export type DomainErrorKind =
  | 'unsupported-format'
  | 'file-too-large'
  | 'decode-failed'
  | 'analysis-cancelled'
  | 'audio-unsupported'
  | 'voice-too-weak';

export class DomainError extends Error {
  readonly kind: DomainErrorKind;
  readonly recoverable: boolean;
  readonly nextStep: string;

  constructor(kind: DomainErrorKind, message: string, nextStep: string, recoverable = true) {
    super(`${message} ${nextStep}`);
    this.name = 'DomainError';
    this.kind = kind;
    this.nextStep = nextStep;
    this.recoverable = recoverable;
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
