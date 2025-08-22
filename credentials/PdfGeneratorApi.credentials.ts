import jwt from 'jsonwebtoken';
import {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';

export class PdfGeneratorApi implements ICredentialType {
	name = 'pdfGeneratorApi';
	displayName = 'PDF Generator API';
	documentationUrl = 'https://docs.pdfgeneratorapi.com/v4';
	properties: INodeProperties[] = [
		{
			displayName: 'API KEY',
			name: 'jwtIss',
			type: 'string',
			required: true,
			default: '',
			description: 'JWT issuer claim',
		},
		{
			displayName: 'Secret',
			name: 'jwtSecret',
			type: 'string',
			required: true,
			default: '',
			typeOptions: {
				password: true,
			},
			description: 'Your JWT secret key for signing tokens',
		},
		{
			displayName: 'Email/workspace',
			name: 'workspace',
			type: 'string',
			required: true,
			default: '',
			description: 'Your email address (workspace identifier and JWT subject)',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: false,
			default: 'https://us1.pdfgeneratorapi.com/api/v4',
			description: 'API base URL (leave default for production, change for local development)',
		},
	];

	// Validate credentials before using them
	private validateCredentials(credentials: ICredentialDataDecryptedObject): void {
		if (!credentials.jwtIss || !credentials.jwtSecret || !credentials.workspace) {
			throw new NodeOperationError(
				{} as any,
				'Missing required credentials. Please provide API Key, Secret, and Email/workspace.',
			);
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(credentials.workspace as string)) {
			throw new NodeOperationError(
				{} as any,
				'Email/workspace must be a valid email address.',
			);
		}
	}

	// Custom authentication method to generate JWT tokens
	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		// Validate credentials first
		this.validateCredentials(credentials);

		// Generate JWT token
		const token = this.generateJWT(credentials);

		// Add authorization header
		requestOptions.headers = {
			...requestOptions.headers,
			'Authorization': `Bearer ${token}`,
		};

		return requestOptions;
	}

	// JWT generation method using jsonwebtoken library
	private generateJWT(credentials: ICredentialDataDecryptedObject): string {
		const currentTimestamp = Math.floor(Date.now() / 1000);

		const payload = {
			iss: credentials.jwtIss as string,
			sub: credentials.workspace as string,
			exp: currentTimestamp + 60, // expiry time is 60 seconds from time of creation
			partner_id: 'n8n-node',
		};

		return jwt.sign(payload, credentials.jwtSecret as string, {
			algorithm: 'HS256',
		});
	}

	// The block below tells how this credential can be tested
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl || "https://us1.pdfgeneratorapi.com/api/v4"}}',
			url: '/workspaces',
			method: 'GET',
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'response',
					value: {},
					message: 'Invalid credentials. Please check your API Key, Secret, and Email/workspace.',
				},
			},
		],
	};
}
