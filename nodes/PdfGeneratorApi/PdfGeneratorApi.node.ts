import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IRequestOptions,
	INodeListSearchResult,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

export class PdfGeneratorApi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PDF Generator API',
		name: 'pdfGeneratorApi',
		icon: { light: 'file:pdfgeneratorapi.svg', dark: 'file:pdfgeneratorapi.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume PDF Generator API',
		defaults: {
			name: 'PDF Generator API',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'pdfGeneratorApi',
				required: true,
			},
		],
		requestDefaults: {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},

		properties: [
			// Resource selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Document',
						value: 'document',
					},
					{
						name: 'Template',
						value: 'template',
					},
					{
						name: 'Workspace',
						value: 'workspace',
					},
				],
				default: 'document',
			},

			// Document Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['document'],
					},
				},
				options: [
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a document from storage',
						action: 'Delete a document from storage',
					},
					{
						name: 'Generate',
						value: 'generate',
						description: 'Generate a PDF document',
						action: 'Generate a PDF document',
					},
					{
						name: 'Generate (Async)',
						value: 'generateAsync',
						description: 'Generate a PDF document asynchronously',
						action: 'Generate a PDF document asynchronously',
					},
					{
						name: 'Generate (Batch)',
						value: 'generateBatch',
						description: 'Generate multiple PDF documents in batch',
						action: 'Generate multiple PDF documents in batch',
					},
					{
						name: 'Generate (Batch + Async)',
						value: 'generateBatchAsync',
						description: 'Generate multiple PDF documents in batch asynchronously',
						action: 'Generate multiple PDF documents in batch asynchronously',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a document by public ID',
						action: 'Get a document by public ID',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List generated documents',
						action: 'List generated documents',
					},
				],
				default: 'generate',
			},

			// Document Public ID field for get and delete operations
			{
				displayName: 'Public ID',
				name: 'publicId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['get', 'delete'],
					},
				},
				default: '',
				description: 'The public ID of the document',
			},

			// List options for document list operation
			{
				displayName: 'List Options',
				name: 'listOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'End Date',
						name: 'end_date',
						type: 'string',
						default: '',
						description: 'End date filter (Format: Y-m-d H:i:s)',
					},
					{
						displayName: 'Page',
						name: 'page',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 1,
						description: 'Page number for pagination',
					},
					{
						displayName: 'Per Page',
						name: 'per_page',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 100,
						},
						default: 15,
						description: 'Number of records per page',
					},
					{
						displayName: 'Start Date',
						name: 'start_date',
						type: 'string',
						default: '',
						description: 'Start date filter (Format: Y-m-d H:i:s)',
					},
					{
						displayName: 'Template ID',
						name: 'template_id',
						type: 'number',
						default: '',
						description: 'Filter by template ID',
					},
				],
			},

			// Templates array for batch operations
			{
				displayName: 'Templates',
				name: 'templates',
				type: 'fixedCollection',
				required: true,
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['generateBatch', 'generateBatchAsync'],
					},
				},
				default: { templateList: [{}] },
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						displayName: 'Template',
						name: 'templateList',
						values: [
							{
								displayName: 'Template',
								name: 'templateId',
								type: 'resourceLocator',
								default: { mode: 'list', value: '' },
								required: true,
								modes: [
									{
										displayName: 'From List',
										name: 'list',
										type: 'list',
										placeholder: 'Select a template...',
										typeOptions: {
											searchListMethod: 'searchTemplates',
											searchable: true,
										},
									},
									{
										displayName: 'By ID',
										name: 'id',
										type: 'string',
										validation: [
											{
												type: 'regex',
												properties: {
													regex: '^[0-9]+$',
													errorMessage: 'Template ID must be a number',
												},
											},
										],
										placeholder: 'e.g. 12345',
									},
								],
							},
							{
								displayName: 'Data',
								name: 'data',
								type: 'json',
								required: true,
								default: '{}',
								description: 'JSON data to merge with the template',
							},
						],
					},
				],
			},

			// Callback URL for async operations
			{
				displayName: 'Callback Options',
				name: 'callbackOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['generateAsync', 'generateBatchAsync'],
					},
				},
				options: [
					{
						displayName: 'Callback URL',
						name: 'url',
						type: 'string',
						default: '',
						description: 'URL to receive the callback when generation is complete',
					},
					{
						displayName: 'Custom Headers',
						name: 'headers',
						type: 'json',
						default: '{}',
						description: 'Custom headers to include in the callback request',
					},
				],
			},

			// Template Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['template'],
					},
				},
				options: [
					{
						name: 'Copy',
						value: 'copy',
						description: 'Copy a template',
						action: 'Copy a template',
					},
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new template',
						action: 'Create a new template',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a template',
						action: 'Delete a template',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a template by ID',
						action: 'Get a template by ID',
					},
					{
						name: 'Get Data Fields',
						value: 'getDataFields',
						description: 'Get template data fields',
						action: 'Get template data fields',
					},
					{
						name: 'List',
						value: 'list',
						description: 'Get all templates',
						action: 'Get all templates',
					},
					{
						name: 'Open Editor',
						value: 'openEditor',
						description: 'Get template editor URL',
						action: 'Get template editor URL',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update an existing template',
						action: 'Update an existing template',
					},
					{
						name: 'Validate',
						value: 'validate',
						description: 'Validate template configuration',
						action: 'Validate template configuration',
					},
				],
				default: 'list',
			},

			// Template selector for document operations
			{
				displayName: 'Template',
				name: 'templateId',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['generate', 'generateAsync'],
					},
				},
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						hint: 'Select a template from the list',
						typeOptions: {
							searchListMethod: 'searchTemplates',
							searchable: true,
							searchFilterRequired: false,
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						hint: 'Enter the template ID directly',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[0-9]+$',
									errorMessage: 'Template ID must be a number',
								},
							},
						],
					},
				],
				description: 'Select the template to use for PDF generation',
			},

			// Template selector for template operations
			{
				displayName: 'Template',
				name: 'templateId',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				displayOptions: {
					show: {
						resource: ['template'],
						operation: ['get', 'update', 'delete', 'getDataFields', 'copy', 'openEditor'],
					},
				},
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						hint: 'Select a template from the list',
						typeOptions: {
							searchListMethod: 'searchTemplates',
							searchable: true,
							searchFilterRequired: false,
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						hint: 'Enter the template ID directly',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[0-9]+$',
									errorMessage: 'Template ID must be a number',
								},
							},
						],
					},
				],
				description: 'Select the template to work with',
			},

			// Output ID field for async operations
			{
				displayName: 'Output ID',
				name: 'outputId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['getOutput'],
					},
				},
				default: '',
				description: 'The ID of the async generation output',
			},

			// Data field for document generation (single template operations)
			{
				displayName: 'Data',
				name: 'data',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['generate', 'generateAsync'],
					},
				},
				default: '{}',
				description: 'JSON data to merge with the template',
			},

			// Format field for document generation
			{
				displayName: 'Format',
				name: 'format',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['generate', 'generateAsync', 'generateBatch', 'generateBatchAsync'],
					},
				},
				options: [
					{
						name: 'HTML',
						value: 'html',
					},
					{
						name: 'PDF',
						value: 'pdf',
					},
					{
						name: 'XLSX',
						value: 'xlsx',
					},
					{
						name: 'ZIP',
						value: 'zip',
					},
				],
				default: 'pdf',
				description: 'Document format to generate',
			},

			// Output field for document generation
			{
				displayName: 'Output',
				name: 'output',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['generate', 'generateBatch'],
					},
				},
				options: [
					{
						name: 'Base64',
						value: 'base64',
						description: 'Return document as base64 encoded string',
					},
					{
						name: 'File',
						value: 'file',
						description: 'Return document as file download',
					},
					{
						name: 'URL',
						value: 'url',
						description: 'Return URL to document (stored for 30 days)',
					},
				],
				default: 'base64',
				description: 'How to return the generated document',
			},

			// Output field for async operations (no 'file' option)
			{
				displayName: 'Output',
				name: 'output',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['generateAsync', 'generateBatchAsync'],
					},
				},
				options: [
					{
						name: 'Base64',
						value: 'base64',
						description: 'Return document as base64 encoded string',
					},
					{
						name: 'URL',
						value: 'url',
						description: 'Return URL to document (stored for 30 days)',
					},
				],
				default: 'base64',
				description: 'How to return the generated document',
			},

			// Additional fields for document generation
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['generate', 'generateAsync', 'generateBatch', 'generateBatchAsync'],
					},
				},
				options: [
					{
						displayName: 'Output Name',
						name: 'outputName',
						type: 'string',
						default: '',
						description: 'Generated document name (optional)',
					},
					{
						displayName: 'Testing',
						name: 'testing',
						type: 'boolean',
						default: false,
						description: 'Whether to use testing mode (generation is not counted but a large PREVIEW stamp is added)',
					},
				],
			},

			// Template name for create operation
			{
				displayName: 'Template Name',
				name: 'templateName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['template'],
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'The name of the template',
			},

			// Template definition for create/update operations
			{
				displayName: 'Template Definition',
				name: 'templateDefinition',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						resource: ['template'],
						operation: ['create', 'update'],
					},
				},
				default: '{}',
				description: 'The JSON template definition',
			},

			// Template configuration for validate operation
			{
				displayName: 'Template Configuration',
				name: 'templateConfig',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						resource: ['template'],
						operation: ['validate'],
					},
				},
				default: '{}',
				description: 'Template configuration to validate',
			},

			// Copy template name
			{
				displayName: 'New Template Name',
				name: 'newTemplateName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['template'],
						operation: ['copy'],
					},
				},
				default: '',
				description: 'Name for the copied template. If not provided, original name is used.',
			},

			// Editor options for open editor operation
			{
				displayName: 'Editor Options',
				name: 'editorOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['template'],
						operation: ['openEditor'],
					},
				},
				options: [
					{
						displayName: 'Data',
						name: 'data',
						type: 'json',
						default: '{}',
						description: 'Data used to preview the template in the editor',
					},
					{
						displayName: 'Language',
						name: 'language',
						type: 'options',
						options: [
							{ name: 'Czech', value: 'cs' },
							{ name: 'English', value: 'en' },
							{ name: 'Estonian', value: 'et' },
							{ name: 'German', value: 'de' },
							{ name: 'Russian', value: 'ru' },
							{ name: 'Slovak', value: 'sk' },
						],
						default: 'en',
						description: 'Editor UI language',
					},
				],
			},

			// Pagination and filtering options for template list
			{
				displayName: 'Options',
				name: 'listOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['template'],
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'Name Filter',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Filter templates by name',
					},
					{
						displayName: 'Tags Filter',
						name: 'tags',
						type: 'string',
						default: '',
						description: 'Filter templates by tags',
					},
					{
						displayName: 'Access Type',
						name: 'access',
						type: 'options',
						options: [
							{ name: 'All', value: '' },
							{ name: 'Private', value: 'private' },
							{ name: 'Organization', value: 'organization' },
						],
						default: '',
						description: 'Filter templates by access type',
					},
					{
						displayName: 'Page',
						name: 'page',
						type: 'number',
						default: 1,
						description: 'Page number to return',
					},
					{
						displayName: 'Per Page',
						name: 'per_page',
						type: 'number',
						default: 15,
						description: 'Number of records to return per page (max 100)',
					},
				],
			},

			// Workspace Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['workspace'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new workspace',
						action: 'Create a new workspace',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a workspace',
						action: 'Delete a workspace',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get workspace by identifier',
						action: 'Get workspace by identifier',
					},
					{
						name: 'List',
						value: 'list',
						description: 'Get all workspaces',
						action: 'Get all workspaces',
					},
				],
				default: 'list',
			},

			// Pagination options for workspace list
			{
				displayName: 'List Options',
				name: 'listOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['workspace'],
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'Page',
						name: 'page',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 1,
						description: 'Page number for pagination',
					},
					{
						displayName: 'Per Page',
						name: 'per_page',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 100,
						},
						default: 15,
						description: 'Number of records per page',
					},
				],
			},

			// Workspace identifier for get and delete operations
			{
				displayName: 'Workspace Identifier',
				name: 'workspaceIdentifier',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['workspace'],
						operation: ['get', 'delete'],
					},
				},
				default: '',
				description: 'The workspace identifier (e.g., user.example@domain.com)',
			},

			// Workspace identifier for create operation
			{
				displayName: 'Identifier',
				name: 'identifier',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['workspace'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'A unique identifier for the new workspace',
			},
		],
	};

	methods = {
		listSearch: {
			async searchTemplates(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
				const returnData: INodePropertyOptions[] = [];

				try {
					const credentials = await this.getCredentials('pdfGeneratorApi');
					const baseURL = (credentials.baseUrl as string) || 'https://us1.pdfgeneratorapi.com/api/v4';

					const options: IRequestOptions = {
						method: 'GET',
						baseURL,
						url: '/templates',
						qs: {
							per_page: 100,
							...(filter && { name: filter }),
						},
						json: true,
					};

					const response = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					if (response && response.response) {
						for (const template of response.response) {
							const displayName = `${template.name} (ID: ${template.id})`;
							// Filter by name if filter is provided
							if (!filter || displayName.toLowerCase().includes(filter.toLowerCase())) {
								returnData.push({
									name: displayName,
									value: template.id.toString(),
								});
							}
						}
					}
				} catch (error) {
					// If API call fails, return empty array
					console.error('Failed to load templates:', error);
				}

				const sortedResults = returnData.sort((a, b) => a.name.localeCompare(b.name));

				return {
					results: sortedResults,
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// Get credentials to get the configurable baseURL
		const credentials = await this.getCredentials('pdfGeneratorApi');
		const baseURL = (credentials.baseUrl as string) || 'https://us1.pdfgeneratorapi.com/api/v4';

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData;

				if (resource === 'document') {
					if (operation === 'list') {
						// List documents
						const listOptions = this.getNodeParameter('listOptions', i, {}) as any;

						// Build query parameters
						const qs: any = {};
						if (listOptions.template_id) qs.template_id = listOptions.template_id;
						if (listOptions.start_date) qs.start_date = listOptions.start_date;
						if (listOptions.end_date) qs.end_date = listOptions.end_date;
						if (listOptions.page) qs.page = listOptions.page;
						if (listOptions.per_page) qs.per_page = listOptions.per_page;

						const options: IRequestOptions = {
							method: 'GET' as IHttpRequestMethods,
							baseURL,
							url: '/documents',
							qs,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'get') {
						// Get document by public ID
						const publicId = this.getNodeParameter('publicId', i) as string;

						const options: IRequestOptions = {
							method: 'GET' as IHttpRequestMethods,
							baseURL,
							url: `/documents/${publicId}`,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'delete') {
						// Delete document by public ID
						const publicId = this.getNodeParameter('publicId', i) as string;

						const options: IRequestOptions = {
							method: 'DELETE' as IHttpRequestMethods,
							baseURL,
							url: `/documents/${publicId}`,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'generate') {
						// Generate PDF document
						const templateIdParam = this.getNodeParameter('templateId', i) as any;
						const templateId = typeof templateIdParam === 'string' ? templateIdParam : templateIdParam.value;
						const data = this.getNodeParameter('data', i) as string;
						const format = this.getNodeParameter('format', i, 'pdf') as string;
						const output = this.getNodeParameter('output', i, 'base64') as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

						const body: any = {
							template: {
								id: templateId,
								data: JSON.parse(data),
							},
							format,
							output,
						};

						// Add additional options
						if (additionalFields.outputName) body.name = additionalFields.outputName;
						if (additionalFields.testing !== undefined) body.testing = additionalFields.testing;

						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: '/documents/generate',
							body,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'generateAsync') {
						// Generate PDF document asynchronously
						const templateIdParam = this.getNodeParameter('templateId', i) as any;
						const templateId = typeof templateIdParam === 'string' ? templateIdParam : templateIdParam.value;
						const data = this.getNodeParameter('data', i) as string;
						const format = this.getNodeParameter('format', i, 'pdf') as string;
						const output = this.getNodeParameter('output', i, 'base64') as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
						const callbackOptions = this.getNodeParameter('callbackOptions', i, {}) as any;

						const body: any = {
							template: {
								id: templateId,
								data: JSON.parse(data),
							},
							format,
							output,
						};

						// Add callback options
						if (callbackOptions.url) {
							body.callback = {
								url: callbackOptions.url,
							};
							if (callbackOptions.headers) {
								body.callback.headers = JSON.parse(callbackOptions.headers);
							}
						}

						// Add additional options
						if (additionalFields.outputName) body.name = additionalFields.outputName;
						if (additionalFields.testing !== undefined) body.testing = additionalFields.testing;

						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: '/documents/generate/async',
							body,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'generateBatch') {
						// Generate multiple PDF documents in batch
						const templates = this.getNodeParameter('templates', i) as any;
						const format = this.getNodeParameter('format', i, 'pdf') as string;
						const output = this.getNodeParameter('output', i, 'base64') as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

						// Build templates array
						const templateArray = templates.templateList.map((template: any) => {
							const templateId = typeof template.templateId === 'string' ? template.templateId : template.templateId.value;
							return {
								id: templateId,
								data: JSON.parse(template.data),
							};
						});

						const body: any = {
							template: templateArray,
							format,
							output,
						};

						// Add additional options
						if (additionalFields.outputName) body.name = additionalFields.outputName;
						if (additionalFields.testing !== undefined) body.testing = additionalFields.testing;

						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: '/documents/generate/batch',
							body,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'generateBatchAsync') {
						// Generate multiple PDF documents in batch asynchronously
						const templates = this.getNodeParameter('templates', i) as any;
						const format = this.getNodeParameter('format', i, 'pdf') as string;
						const output = this.getNodeParameter('output', i, 'base64') as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
						const callbackOptions = this.getNodeParameter('callbackOptions', i, {}) as any;

						// Build templates array
						const templateArray = templates.templateList.map((template: any) => {
							const templateId = typeof template.templateId === 'string' ? template.templateId : template.templateId.value;
							return {
								id: templateId,
								data: JSON.parse(template.data),
							};
						});

						const body: any = {
							template: templateArray,
							format,
							output,
						};

						// Add callback options
						if (callbackOptions.url) {
							body.callback = {
								url: callbackOptions.url,
							};
							if (callbackOptions.headers) {
								body.callback.headers = JSON.parse(callbackOptions.headers);
							}
						}

						// Add additional options
						if (additionalFields.outputName) body.name = additionalFields.outputName;
						if (additionalFields.testing !== undefined) body.testing = additionalFields.testing;

						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: '/documents/generate/batch/async',
							body,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);
					}

				} else if (resource === 'template') {
					if (operation === 'list') {
						// List all templates
						const listOptions = this.getNodeParameter('listOptions', i, {}) as any;

						// Build query parameters
						const qs: any = {};
						if (listOptions.name) qs.name = listOptions.name;
						if (listOptions.tags) qs.tags = listOptions.tags;
						if (listOptions.access) qs.access = listOptions.access;
						if (listOptions.page) qs.page = listOptions.page;
						if (listOptions.per_page) qs.per_page = listOptions.per_page;

						const options: IRequestOptions = {
							method: 'GET' as IHttpRequestMethods,
							baseURL,
							url: '/templates',
							qs,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'get') {
						// Get template by ID
						const templateIdParam = this.getNodeParameter('templateId', i) as any;
						const templateId = typeof templateIdParam === 'string' ? templateIdParam : templateIdParam.value;

						const options: IRequestOptions = {
							method: 'GET' as IHttpRequestMethods,
							baseURL,
							url: `/templates/${templateId}`,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'create') {
						// Create new template
						const templateName = this.getNodeParameter('templateName', i) as string;
						const templateDefinition = this.getNodeParameter('templateDefinition', i) as string;

						const body = {
							name: templateName,
							...JSON.parse(templateDefinition),
						};

						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: '/templates',
							body,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'update') {
						// Update existing template
						const templateIdParam = this.getNodeParameter('templateId', i) as any;
						const templateId = typeof templateIdParam === 'string' ? templateIdParam : templateIdParam.value;
						const templateName = this.getNodeParameter('templateName', i) as string;
						const templateDefinition = this.getNodeParameter('templateDefinition', i) as string;

						const body = {
							name: templateName,
							...JSON.parse(templateDefinition),
						};

						const options: IRequestOptions = {
							method: 'PUT' as IHttpRequestMethods,
							baseURL,
							url: `/templates/${templateId}`,
							body,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'delete') {
						// Delete template
						const templateIdParam = this.getNodeParameter('templateId', i) as any;
						const templateId = typeof templateIdParam === 'string' ? templateIdParam : templateIdParam.value;

						const options: IRequestOptions = {
							method: 'DELETE' as IHttpRequestMethods,
							baseURL,
							url: `/templates/${templateId}`,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'validate') {
						// Validate template configuration
						const templateConfig = this.getNodeParameter('templateConfig', i) as string;

						const body = JSON.parse(templateConfig);

						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: '/templates/validate',
							body,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'getDataFields') {
						// Get template data fields
						const templateIdParam = this.getNodeParameter('templateId', i) as any;
						const templateId = typeof templateIdParam === 'string' ? templateIdParam : templateIdParam.value;

						const options: IRequestOptions = {
							method: 'GET' as IHttpRequestMethods,
							baseURL,
							url: `/templates/${templateId}/data`,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'copy') {
						// Copy template
						const templateIdParam = this.getNodeParameter('templateId', i) as any;
						const templateId = typeof templateIdParam === 'string' ? templateIdParam : templateIdParam.value;
						const newTemplateName = this.getNodeParameter('newTemplateName', i, '') as string;

						const body: any = {};
						if (newTemplateName) body.name = newTemplateName;

						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: `/templates/${templateId}/copy`,
							body,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'openEditor') {
						// Open template editor
						const templateIdParam = this.getNodeParameter('templateId', i) as any;
						const templateId = typeof templateIdParam === 'string' ? templateIdParam : templateIdParam.value;
						const editorOptions = this.getNodeParameter('editorOptions', i, {}) as any;

						const body: any = {};
						if (editorOptions.data) body.data = JSON.parse(editorOptions.data);
						if (editorOptions.language) body.language = editorOptions.language;

						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: `/templates/${templateId}/editor`,
							body,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);
					}

				} else if (resource === 'workspace') {
					if (operation === 'list') {
						// List all workspaces
						const listOptions = this.getNodeParameter('listOptions', i, {}) as any;

						// Build query parameters
						const qs: any = {};
						if (listOptions.page) qs.page = listOptions.page;
						if (listOptions.per_page) qs.per_page = listOptions.per_page;

						const options: IRequestOptions = {
							method: 'GET' as IHttpRequestMethods,
							baseURL,
							url: '/workspaces',
							qs,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'create') {
						// Create new workspace
						const identifier = this.getNodeParameter('identifier', i) as string;

						const body = {
							identifier,
						};

						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: '/workspaces',
							body,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'get') {
						// Get workspace by identifier
						const workspaceIdentifier = this.getNodeParameter('workspaceIdentifier', i) as string;

						const options: IRequestOptions = {
							method: 'GET' as IHttpRequestMethods,
							baseURL,
							url: `/workspaces/${encodeURIComponent(workspaceIdentifier)}`,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'delete') {
						// Delete workspace
						const workspaceIdentifier = this.getNodeParameter('workspaceIdentifier', i) as string;

						const options: IRequestOptions = {
							method: 'DELETE' as IHttpRequestMethods,
							baseURL,
							url: `/workspaces/${encodeURIComponent(workspaceIdentifier)}`,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);
					}
				}

				if (responseData === undefined) {
					throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for resource "${resource}"`);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);

				returnData.push(...executionData);

			} catch (error) {
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionErrorData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}



