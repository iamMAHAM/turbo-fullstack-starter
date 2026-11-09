import type { PaginationInput } from '@app/schemas';

export const paginate = <T>(
	items: T[],
	total: number,
	input: PaginationInput,
) => ({
	items,
	meta: {
		page: input.page,
		perPage: input.perPage,
		total,
		totalPages: Math.max(1, Math.ceil(total / input.perPage)),
	},
});
