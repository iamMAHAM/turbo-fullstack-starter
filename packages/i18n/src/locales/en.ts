export const en = {
	admin: {
		title: 'Admin',
	},
	auth: {
		signIn: {
			title: 'Sign in',
			submit: 'Sign in',
		},
		signOut: 'Sign out',
		email: 'Email',
		password: 'Password',
		signedInAs: 'Signed in as {{email}}',
	},
	home: {
		greeting: 'Hello, {{name}}',
	},
	errors: {
		invalidForm: 'Check the form fields.',
		network: 'Cannot reach the server. Check your connection.',
	},
};

export type Translations = typeof en;
