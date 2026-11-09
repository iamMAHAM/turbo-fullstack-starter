import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Users (e2e)', () => {
	let app: NestExpressApplication;
	let cookie: string[];
	const email = `e2e-${randomUUID()}@example.com`;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();
		app = moduleRef.createNestApplication<NestExpressApplication>();
		configureApp(app);
		await app.init();

		const res = await request(app.getHttpServer())
			.post('/api/auth/sign-up/email')
			.send({ email, password: 'correct-horse-battery', name: 'E2E' })
			.expect(200);
		cookie = [res.get('set-cookie') ?? []].flat();
	});

	afterAll(async () => {
		await app?.get(PrismaService).user.deleteMany({ where: { email } });
		await app?.close();
	});

	it('issues an HttpOnly, SameSite=Lax session cookie', () => {
		const session = cookie.find((c) => c.includes('session_token'));
		expect(session).toMatch(/HttpOnly/i);
		expect(session).toMatch(/SameSite=Lax/i);
	});

	it('returns the email to its owner', async () => {
		const res = await request(app.getHttpServer())
			.get('/v1/users/me')
			.set('Cookie', cookie)
			.expect(200);
		expect(res.body.email).toBe(email);
	});

	it('never exposes emails to other users', async () => {
		const me = await request(app.getHttpServer())
			.get('/v1/users/me')
			.set('Cookie', cookie);

		const list = await request(app.getHttpServer())
			.get('/v1/users')
			.set('Cookie', cookie)
			.expect(200);
		expect(list.body.items.length).toBeGreaterThan(0);
		for (const user of list.body.items) {
			expect(user).not.toHaveProperty('email');
		}

		const one = await request(app.getHttpServer())
			.get(`/v1/users/${me.body.id}`)
			.set('Cookie', cookie)
			.expect(200);
		expect(one.body).not.toHaveProperty('email');
	});

	it('rejects a non-https avatar', async () => {
		await request(app.getHttpServer())
			.patch('/v1/users/me')
			.set('Cookie', cookie)
			.send({ image: 'javascript:alert(1)' })
			.expect(400);
	});

	it('translates Better Auth errors into the request locale', async () => {
		const fr = await request(app.getHttpServer())
			.post('/api/auth/sign-in/email')
			.set('x-locale', 'fr')
			.send({ email, password: 'wrong-password-123' })
			.expect(401);
		expect(fr.body.code).toBe('auth:INVALID_CREDENTIALS');
		expect(fr.body.message).toBe('E-mail ou mot de passe incorrect.');

		const en = await request(app.getHttpServer())
			.post('/api/auth/sign-in/email')
			.set('x-locale', 'en')
			.send({ email, password: 'wrong-password-123' })
			.expect(401);
		expect(en.body.message).toBe('Email or password is incorrect.');
	});

	it('rejects a non-https avatar through Better Auth routes too', async () => {
		const other = `e2e-${randomUUID()}@example.com`;
		try {
			await request(app.getHttpServer())
				.post('/api/auth/sign-up/email')
				.send({
					email: other,
					password: 'correct-horse-battery',
					name: 'XSS',
					image: 'javascript:alert(1)',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body.code).toBe('users:IMAGE_URL_INVALID');
				});
		} finally {
			await app.get(PrismaService).user.deleteMany({ where: { email: other } });
		}

		await request(app.getHttpServer())
			.post('/api/auth/update-user')
			.set('Cookie', cookie)
			.set('Origin', 'http://localhost:3000')
			.send({ image: 'javascript:alert(1)' })
			.expect(400);

		const me = await request(app.getHttpServer())
			.get('/v1/users/me')
			.set('Cookie', cookie);
		expect(me.body.image).toBeNull();
	});
});
