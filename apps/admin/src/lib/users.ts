import { type User, userSchema } from '@app/schemas';
import { apiGet } from './api';

export const getMe = (init?: RequestInit): Promise<User> =>
	apiGet('/v1/users/me', userSchema, init);
