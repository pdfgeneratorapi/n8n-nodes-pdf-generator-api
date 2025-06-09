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

	// JWT generation method adapted from the provided JavaScript code
	private generateJWT(credentials: ICredentialDataDecryptedObject): string {
		const crypto = require('crypto');

		// Set headers for JWT
		const header = {
			'typ': 'JWT',
			'alg': 'HS256'
		};

		// Prepare timestamp in seconds
		const currentTimestamp = Math.floor(Date.now() / 1000);

		const data = {
			'iss': credentials.jwtIss as string,
			'sub': credentials.workspace as string,
			'exp': currentTimestamp + 60, // expiry time is 60 seconds from time of creation
		};

		// Base64url encoding function
		function base64url(source: Buffer): string {
			// Encode in classical base64
			let encodedSource = source.toString('base64');

			// Remove padding equal characters
			encodedSource = encodedSource.replace(/=+$/, '');

			// Replace characters according to base64url specifications
			encodedSource = encodedSource.replace(/\+/g, '-');
			encodedSource = encodedSource.replace(/\//g, '_');

			return encodedSource;
		}

		// Encode header
		const stringifiedHeader = Buffer.from(JSON.stringify(header));
		const encodedHeader = base64url(stringifiedHeader);

		// Encode data
		const stringifiedData = Buffer.from(JSON.stringify(data));
		const encodedData = base64url(stringifiedData);

		// Build token
		const token = `${encodedHeader}.${encodedData}`;

		// Sign token
		const signature = crypto.createHmac('sha256', credentials.jwtSecret as string).update(token).digest();
		const encodedSignature = base64url(signature);
		const signedToken = `${token}.${encodedSignature}`;

		return signedToken;
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
