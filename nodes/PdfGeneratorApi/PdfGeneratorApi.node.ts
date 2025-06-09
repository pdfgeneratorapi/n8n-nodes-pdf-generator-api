import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IRequestOptions,
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
						name: 'Generate PDF',
						value: 'generate',
						description: 'Generate a PDF document',
						action: 'Generate a PDF document',
					},
					{
						name: 'Generate PDF (Async)',
						value: 'generateAsync',
						description: 'Generate a PDF document asynchronously',
						action: 'Generate a PDF document asynchronously',
					},
					{
						name: 'Get Output',
						value: 'getOutput',
						description: 'Get the output of an async generation',
						action: 'Get the output of an async generation',
					},
				],
				default: 'generate',
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
						name: 'List',
						value: 'list',
						description: 'Get all workspaces',
						action: 'Get all workspaces',
					},
				],
				default: 'list',
			},

			// Template ID field
			{
				displayName: 'Template ID',
				name: 'templateId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['generate', 'generateAsync'],
					},
				},
				default: '',
				description: 'The ID of the template to use for PDF generation',
			},

			{
				displayName: 'Template ID',
				name: 'templateId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['template'],
						operation: ['get', 'update', 'delete', 'getDataFields', 'copy', 'openEditor'],
					},
				},
				default: '',
				description: 'The ID of the template',
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

			// Data for PDF generation
			{
				displayName: 'Data',
				name: 'data',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['generate', 'generateAsync'],
					},
				},
				default: '{}',
				description: 'The data to merge with the template',
			},

			// Format options
			{
				displayName: 'Format',
				name: 'format',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['generate', 'generateAsync'],
					},
				},
				options: [
					{
						name: 'PDF',
						value: 'pdf',
					},
					{
						name: 'HTML',
						value: 'html',
					},
				],
				default: 'pdf',
				description: 'The output format',
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

			// Additional options for document generation
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['generate', 'generateAsync'],
					},
				},
				options: [
					{
						displayName: 'Output Name',
						name: 'outputName',
						type: 'string',
						default: '',
						description: 'Name for the generated file',
					},
					{
						displayName: 'Page Size',
						name: 'pageSize',
						type: 'options',
						options: [
							{ name: 'A3', value: 'A3' },
							{ name: 'A4', value: 'A4' },
							{ name: 'A5', value: 'A5' },
							{ name: 'Legal', value: 'Legal' },
							{ name: 'Letter', value: 'Letter' },
						],
						default: 'A4',
						description: 'Page size for the PDF',
					},
					{
						displayName: 'Orientation',
						name: 'orientation',
						type: 'options',
						options: [
							{ name: 'Portrait', value: 'portrait' },
							{ name: 'Landscape', value: 'landscape' },
						],
						default: 'portrait',
						description: 'Page orientation',
					},
					{
						displayName: 'Margin Top',
						name: 'marginTop',
						type: 'number',
						default: 0,
						description: 'Top margin in pixels',
					},
					{
						displayName: 'Margin Bottom',
						name: 'marginBottom',
						type: 'number',
						default: 0,
						description: 'Bottom margin in pixels',
					},
					{
						displayName: 'Margin Left',
						name: 'marginLeft',
						type: 'number',
						default: 0,
						description: 'Left margin in pixels',
					},
					{
						displayName: 'Margin Right',
						name: 'marginRight',
						type: 'number',
						default: 0,
						description: 'Right margin in pixels',
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

			// Pagination options for workspace list
			{
				displayName: 'Options',
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
		],
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
					if (operation === 'generate') {
						// Generate PDF document
						const templateId = this.getNodeParameter('templateId', i) as string;
						const data = this.getNodeParameter('data', i) as string;
						const format = this.getNodeParameter('format', i, 'pdf') as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

						const body: any = {
							template_id: templateId,
							data: JSON.parse(data),
							format,
						};

						// Add additional options
						if (additionalFields.outputName) body.name = additionalFields.outputName;
						if (additionalFields.pageSize) body.page_size = additionalFields.pageSize;
						if (additionalFields.orientation) body.orientation = additionalFields.orientation;
						if (additionalFields.marginTop !== undefined) body.margin_top = additionalFields.marginTop;
						if (additionalFields.marginBottom !== undefined) body.margin_bottom = additionalFields.marginBottom;
						if (additionalFields.marginLeft !== undefined) body.margin_left = additionalFields.marginLeft;
						if (additionalFields.marginRight !== undefined) body.margin_right = additionalFields.marginRight;

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
						const templateId = this.getNodeParameter('templateId', i) as string;
						const data = this.getNodeParameter('data', i) as string;
						const format = this.getNodeParameter('format', i, 'pdf') as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

						const body: any = {
							template_id: templateId,
							data: JSON.parse(data),
							format,
						};

						// Add additional options
						if (additionalFields.outputName) body.name = additionalFields.outputName;
						if (additionalFields.pageSize) body.page_size = additionalFields.pageSize;
						if (additionalFields.orientation) body.orientation = additionalFields.orientation;
						if (additionalFields.marginTop !== undefined) body.margin_top = additionalFields.marginTop;
						if (additionalFields.marginBottom !== undefined) body.margin_bottom = additionalFields.marginBottom;
						if (additionalFields.marginLeft !== undefined) body.margin_left = additionalFields.marginLeft;
						if (additionalFields.marginRight !== undefined) body.margin_right = additionalFields.marginRight;

						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: '/documents/generate/async',
							body,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'getOutput') {
						// Get async generation output
						const outputId = this.getNodeParameter('outputId', i) as string;

						const options: IRequestOptions = {
							method: 'GET' as IHttpRequestMethods,
							baseURL,
							url: `/documents/generate/async/${outputId}`,
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
						const templateId = this.getNodeParameter('templateId', i) as string;

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
						const templateId = this.getNodeParameter('templateId', i) as string;
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
						const templateId = this.getNodeParameter('templateId', i) as string;

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
						const templateId = this.getNodeParameter('templateId', i) as string;

						const options: IRequestOptions = {
							method: 'GET' as IHttpRequestMethods,
							baseURL,
							url: `/templates/${templateId}/data`,
							json: true,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'copy') {
						// Copy template
						const templateId = this.getNodeParameter('templateId', i) as string;
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
						const templateId = this.getNodeParameter('templateId', i) as string;
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
