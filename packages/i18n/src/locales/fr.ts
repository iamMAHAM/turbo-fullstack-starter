import type { Translations } from './en.js';

export const fr: Translations = {
	admin: {
		title: 'Administration',
	},
	auth: {
		signIn: {
			title: 'Connexion',
			submit: 'Se connecter',
		},
		signOut: 'Se déconnecter',
		email: 'E-mail',
		password: 'Mot de passe',
		signedInAs: 'Connecté en tant que {{email}}',
	},
	home: {
		greeting: 'Bonjour, {{name}}',
	},
	errors: {
		invalidForm: 'Vérifiez les champs du formulaire.',
		network: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
	},
};
