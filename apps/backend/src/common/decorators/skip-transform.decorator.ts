import { SetMetadata } from '@nestjs/common';

export const SKIP_TRANSFORM_KEY = 'skipTransform';

/** Skip the global response transform interceptor (e.g. health probes). */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
