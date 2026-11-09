import { z } from 'zod';

export const paginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const paginatedSchema = <T extends z.ZodType>(item: T) =>
	z.object({
		items: z.array(item),
		meta: z.object({
			page: z.number().int(),
			perPage: z.number().int(),
			total: z.number().int(),
			totalPages: z.number().int(),
		}),
	});
