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
		description: 'Generate PDFs, manage templates, convert HTML/URLs to PDF, and perform PDF operations like watermarking, encryption, and optimization',
		defaults: {
			name: 'PDF Generator API',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
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
						name: 'Conversion',
						value: 'conversion',
						description: 'Convert HTML content or URLs directly to PDF without templates',
					},
					{
						name: 'Document',
						value: 'document',
						description: 'Generate PDFs from templates with data, manage document storage',
					},
					{
						name: 'PDF Service',
						value: 'pdfServices',
						description: 'Process existing PDFs: add watermarks, encrypt, decrypt, or optimize',
					},
					{
						name: 'Template',
						value: 'template',
						description: 'Create, update, and manage PDF templates for document generation',
					},
					{
						name: 'Workspace',
						value: 'workspace',
						description: 'Manage workspaces for organizing templates and users',
					},
				],
				default: 'document',
				description: 'Choose the type of PDF operation: generate documents from templates, convert HTML/URLs, process existing PDFs, or manage templates and workspaces',
			},

			// Conversion Operations
			{
				displayName: 'Operation',
				name: 'conversionOperation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['conversion'],
					},
				},
				options: [
					{
						name: 'HTML to PDF',
						value: 'htmlToPdf',
						description: 'Convert HTML content to PDF',
						action: 'Convert HTML content to PDF',
					},
					{
						name: 'URL to PDF',
						value: 'urlToPdf',
						description: 'Convert public URL to PDF',
						action: 'Convert public URL to PDF',
					},
				],
				default: 'htmlToPdf',
			},

			// Document Operations
			{
				displayName: 'Operation',
				name: 'documentOperation',
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
						name: 'Generate (Batch + Async)',
						value: 'generateBatchAsync',
						description: 'Generate multiple PDF documents in batch asynchronously',
						action: 'Generate multiple PDF documents in batch asynchronously',
					},
					{
						name: 'Generate (Batch)',
						value: 'generateBatch',
						description: 'Generate multiple PDF documents in batch',
						action: 'Generate multiple PDF documents in batch',
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

			// PDF Services Operations
			{
				displayName: 'Operation',
				name: 'pdfServicesOperation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['pdfServices'],
					},
				},
				options: [
					{
						name: 'Add Watermark',
						value: 'addWatermark',
						description: 'Add text or image watermark to PDF document',
						action: 'Add watermark to PDF document',
					},
					{
						name: 'Decrypt Document',
						value: 'decrypt',
						description: 'Decrypt an encrypted PDF document',
						action: 'Decrypt encrypted PDF document',
					},
					{
						name: 'Encrypt Document',
						value: 'encrypt',
						description: 'Encrypt a PDF document with password protection',
						action: 'Encrypt PDF document with password',
					},
					{
						name: 'Extract Form Fields',
						value: 'extractFormFields',
						description: 'Extract form fields and their metadata from a PDF document',
						action: 'Extract form fields from PDF document',
					},
					{
						name: 'Fill Form Fields',
						value: 'fillFormFields',
						description: 'Fill form fields in a PDF document with provided data',
						action: 'Fill form fields in PDF document',
					},
					{
						name: 'Optimize Document',
						value: 'optimize',
						description: 'Optimize PDF document size for better performance',
						action: 'Optimize PDF document size',
					},
				],
				default: 'addWatermark',
			},

			// PDF Services: PDF Source
			{
				displayName: 'PDF Source',
				name: 'pdfSource',
				type: 'options',
				options: [
					{
						name: 'From URL',
						value: 'url',
						description: 'Use a PDF from a public URL',
					},
					{
						name: 'From Base64',
						value: 'base64',
						description: 'Use a PDF from base64 encoded content',
					},
				],
				default: 'url',
				displayOptions: {
					show: {
						resource: ['pdfServices'],
					},
				},
				description: 'Source of the PDF document to process',
			},

			// PDF Services: PDF URL
			{
				displayName: 'PDF URL',
				name: 'fileUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['pdfServices'],
						pdfSource: ['url'],
					},
				},
				default: '',
				description: 'Public URL to the PDF document',
				placeholder: 'https://example.com/document.pdf',
			},

			// PDF Services: PDF Base64
			{
				displayName: 'PDF Base64',
				name: 'fileBase64',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				required: true,
				displayOptions: {
					show: {
						resource: ['pdfServices'],
						pdfSource: ['base64'],
					},
				},
				default: '',
				description: 'Base64 encoded PDF content',
				placeholder: 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8...',
			},

			// PDF Services: Output Format
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				options: [
					{
						name: 'Base64 (JSON)',
						value: 'base64',
						description: 'Returns JSON response with base64 string',
					},
					{
						name: 'File (Binary)',
						value: 'file',
						description: 'Returns binary file data for download/attachment',
					},
					{
						name: 'URL (JSON)',
						value: 'url',
						description: 'Returns JSON response with download URL',
					},
				],
				default: 'base64',
				displayOptions: {
					show: {
						resource: ['pdfServices'],
					},
				},
				description: 'Choose output format: JSON with base64 string, download URL, or binary file',
			},

			// PDF Services: Watermark Type
			{
				displayName: 'Watermark Type',
				name: 'watermarkType',
				type: 'multiOptions',
				options: [
					{
						name: 'Text',
						value: 'text',
						description: 'Add text watermark',
					},
					{
						name: 'Image',
						value: 'image',
						description: 'Add image watermark',
					},
				],
				default: ['text'],
				displayOptions: {
					show: {
						resource: ['pdfServices'],
						pdfServicesOperation: ['addWatermark'],
					},
				},
				description: 'Type of watermark to add (can select both text and image)',
			},

			// PDF Services: Watermark Text
			{
				displayName: 'Watermark Text',
				name: 'watermarkText',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['pdfServices'],
						pdfServicesOperation: ['addWatermark'],
						watermarkType: ['text'],
					},
				},
				default: 'CONFIDENTIAL',
				description: 'Text to use as watermark',
				placeholder: 'CONFIDENTIAL',
			},

			// PDF Services: Watermark Image URL
			{
				displayName: 'Watermark Image URL',
				name: 'watermarkImageUrl',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['pdfServices'],
						pdfServicesOperation: ['addWatermark'],
						watermarkType: ['image'],
					},
				},
				default: '',
				description: 'URL to image file to use as watermark',
				placeholder: 'https://example.com/watermark.png',
			},

			// PDF Services: Text Watermark Options
			{
				displayName: 'Text Watermark Options',
				name: 'textWatermarkOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['pdfServices'],
						pdfServicesOperation: ['addWatermark'],
						watermarkType: ['text'],
					},
				},
				description: 'Additional options for text watermark',
				options: [
					{
						displayName: 'Color',
						name: 'color',
						type: 'color',
						default: '#FF0000',
						description: 'Color of the text watermark',
					},
					{
						displayName: 'Font Size',
						name: 'size',
						type: 'number',
						typeOptions: {
							minValue: 7,
							maxValue: 80,
						},
						default: 48,
						description: 'Font size of the text watermark',
					},
					{
						displayName: 'Opacity',
						name: 'opacity',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 1,
							numberPrecision: 2,
						},
						default: 0.5,
						description: 'Opacity of the text watermark (0 = transparent, 1 = opaque)',
					},
					{
						displayName: 'Position',
						name: 'position',
						type: 'options',
						options: [
							{
								name: 'Bottom Center',
								value: 'bottom-center',
							},
							{
								name: 'Bottom Left',
								value: 'bottom-left',
							},
							{
								name: 'Bottom Right',
								value: 'bottom-right',
							},
							{
								name: 'Center',
								value: 'center',
							},
							{
								name: 'Center Left',
								value: 'center-left',
							},
							{
								name: 'Center Right',
								value: 'center-right',
							},
							{
								name: 'Top Center',
								value: 'top-center',
							},
							{
								name: 'Top Left',
								value: 'top-left',
							},
							{
								name: 'Top Right',
								value: 'top-right',
							},
						],
						default: 'center',
						description: 'Position of the text watermark on the page',
					},
					{
						displayName: 'Rotation',
						name: 'rotation',
						type: 'number',
						typeOptions: {
							minValue: -180,
							maxValue: 180,
						},
						default: 0,
						description: 'Rotation angle in degrees (-180 to 180)',
					},
				],
			},

			// PDF Services: Image Watermark Options
			{
				displayName: 'Image Watermark Options',
				name: 'imageWatermarkOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['pdfServices'],
						pdfServicesOperation: ['addWatermark'],
						watermarkType: ['image'],
					},
				},
				description: 'Additional options for image watermark',
				options: [
					{
						displayName: 'Position',
						name: 'position',
						type: 'options',
						options: [
							{
								name: 'Bottom Center',
								value: 'bottom-center',
							},
							{
								name: 'Bottom Left',
								value: 'bottom-left',
							},
							{
								name: 'Bottom Right',
								value: 'bottom-right',
							},
							{
								name: 'Center',
								value: 'center',
							},
							{
								name: 'Center Left',
								value: 'center-left',
							},
							{
								name: 'Center Right',
								value: 'center-right',
							},
							{
								name: 'Top Center',
								value: 'top-center',
							},
							{
								name: 'Top Left',
								value: 'top-left',
							},
							{
								name: 'Top Right',
								value: 'top-right',
							},
						],
						default: 'center',
						description: 'Position of the image watermark on the page',
					},
					{
						displayName: 'Rotation',
						name: 'rotation',
						type: 'number',
						typeOptions: {
							minValue: -180,
							maxValue: 180,
						},
						default: 0,
						description: 'Rotation angle in degrees (-180 to 180)',
					},
					{
						displayName: 'Scale',
						name: 'scale',
						type: 'number',
						typeOptions: {
							minValue: 0.1,
							maxValue: 5,
							numberPrecision: 2,
						},
						default: 1,
						description: 'Scale factor for the image watermark (0.1 to 5)',
					},
				],
			},

			// PDF Services: Owner Password
			{
				displayName: 'Owner Password',
				name: 'ownerPassword',
				type: 'string',
				typeOptions: {
					password: true,
				},
				displayOptions: {
					show: {
						resource: ['pdfServices'],
						pdfServicesOperation: ['encrypt'],
					},
				},
				default: '',
				description: 'Owner password for full access to the PDF (optional but recommended)',
				placeholder: 'Enter owner password',
			},

			// PDF Services: User Password
			{
				displayName: 'User Password',
				name: 'userPassword',
				type: 'string',
				typeOptions: {
					password: true,
				},
				displayOptions: {
					show: {
						resource: ['pdfServices'],
						pdfServicesOperation: ['encrypt'],
					},
				},
				default: '',
				description: 'User password for viewing the PDF (optional but recommended)',
				placeholder: 'Enter user password',
			},

			// PDF Services: Decryption Password
			{
				displayName: 'Password',
				name: 'decryptionPassword',
				type: 'string',
				typeOptions: {
					password: true,
				},
				required: true,
				displayOptions: {
					show: {
						resource: ['pdfServices'],
						pdfServicesOperation: ['decrypt'],
					},
				},
				default: '',
				description: 'Password to decrypt the PDF document',
				placeholder: 'Enter decryption password',
			},

			// PDF Services: Form Fields Data
			{
				displayName: 'Form Fields Data',
				name: 'formFieldsData',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						resource: ['pdfServices'],
						pdfServicesOperation: ['fillFormFields'],
					},
				},
				default: '{}',
				description: 'JSON object containing the form field names as keys and their values as data to fill in the PDF form',
				placeholder: '{"firstName": "John", "lastName": "Doe", "email": "john.doe@example.com"}',
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
						documentOperation: ['get', 'delete'],
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
						documentOperation: ['list'],
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
						documentOperation: ['generateBatch', 'generateBatchAsync'],
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
						documentOperation: ['generateAsync', 'generateBatchAsync'],
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
						documentOperation: ['generate', 'generateAsync'],
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
						documentOperation: ['getOutput'],
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
						documentOperation: ['generate', 'generateAsync'],
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
						documentOperation: ['generate', 'generateAsync', 'generateBatch', 'generateBatchAsync'],
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
					{
						name: 'ZIP',
						value: 'zip',
					},
					{
						name: 'XLSX',
						value: 'xlsx',
					},
				],
				default: 'pdf',
				description: 'Document format. ZIP option returns a ZIP file with PDF files.',
			},

			// Output field for document generation
			{
				displayName: 'Output',
				name: 'output',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['document'],
						documentOperation: ['generate', 'generateBatch'],
					},
				},
				options: [
					{
						name: 'Base64',
						value: 'base64',
					},
					{
						name: 'File',
						value: 'file',
					},
					{
						name: 'URL',
						value: 'url',
					},
				],
				default: 'base64',
				description: 'Response format. File option returns the file inline. URL option stores document for 30 days.',
			},

			// Output field for async document generation
			{
				displayName: 'Output',
				name: 'output',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['document'],
						documentOperation: ['generateAsync', 'generateBatchAsync'],
					},
				},
				options: [
					{
						name: 'Base64',
						value: 'base64',
					},
					{
						name: 'URL',
						value: 'url',
					},
				],
				default: 'base64',
				description: 'Response format. URL option stores document for 30 days.',
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
						documentOperation: ['generate', 'generateAsync', 'generateBatch', 'generateBatchAsync'],
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

			// Template configuration for create/update operations
			{
				displayName: 'Template Configuration JSON',
				name: 'templateConfiguration',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						resource: ['template'],
						operation: ['create', 'update'],
					},
				},
				default: '{\n  "name": "My Template",\n  "tags": [],\n  "isDraft": true,\n  "layout": {\n    "format": "A4",\n    "unit": "cm",\n    "orientation": "portrait",\n    "rotation": 0,\n    "margins": {\n      "top": 0,\n      "left": 0,\n      "right": 0,\n      "bottom": 0\n    },\n    "emptyLabels": 0,\n    "width": 21,\n    "height": 29.7,\n    "repeatLayout": null\n  },\n  "pages": [\n    {\n      "width": 21,\n      "height": 29.7,\n      "conditionalFormats": [],\n      "backgroundImage": null,\n      "layout": [],\n      "components": [],\n      "margins": {\n        "right": 0,\n        "bottom": 0\n      },\n      "border": false\n    }\n  ],\n  "dataSettings": {\n    "sortBy": [],\n    "filterBy": [],\n    "transform": []\n  },\n  "editor": {\n    "heightMultiplier": 1\n  },\n  "fontSubsetting": false,\n  "barcodeAsImage": false\n}',
				description: 'The complete template configuration JSON object - provide the template object directly, NOT wrapped in another object. Must include: name, layout, pages array, dataSettings, editor objects. Example: {"name": "My Template", "layout": {...}, "pages": [...], "dataSettings": {...}, "editor": {...}}',
			},

			// Template configuration for validate operation
			{
				displayName: 'Template Configuration JSON',
				name: 'templateConfig',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						resource: ['template'],
						operation: ['validate'],
					},
				},
				default: '{\n  "name": "My Template",\n  "tags": [],\n  "isDraft": true,\n  "layout": {\n    "format": "A4",\n    "unit": "cm",\n    "orientation": "portrait",\n    "rotation": 0,\n    "margins": {\n      "top": 0,\n      "left": 0,\n      "right": 0,\n      "bottom": 0\n    },\n    "emptyLabels": 0,\n    "width": 21,\n    "height": 29.7,\n    "repeatLayout": null\n  },\n  "pages": [\n    {\n      "width": 21,\n      "height": 29.7,\n      "conditionalFormats": [],\n      "backgroundImage": null,\n      "layout": [],\n      "components": [],\n      "margins": {\n        "right": 0,\n        "bottom": 0\n      },\n      "border": false\n    }\n  ],\n  "dataSettings": {\n    "sortBy": [],\n    "filterBy": [],\n    "transform": []\n  },\n  "editor": {\n    "heightMultiplier": 1\n  },\n  "fontSubsetting": false,\n  "barcodeAsImage": false\n}',
				description: 'Template configuration JSON to validate - provide the template object directly, NOT wrapped in another object. Must include: name, layout, pages array, dataSettings, editor objects. Example: {"name": "My Template", "layout": {...}, "pages": [...], "dataSettings": {...}, "editor": {...}}',
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
				displayName: 'List Options',
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
						displayName: 'Access Type',
						name: 'access',
						type: 'options',
						options: [
							{ name: 'All', value: '' },
							{ name: 'Organization', value: 'organization' },
							{ name: 'Private', value: 'private' },
						],
						default: '',
						description: 'Filter templates by access type',
					},
					{
						displayName: 'Name Filter',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Filter templates by name',
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
					{
						displayName: 'Tags Filter',
						name: 'tags',
						type: 'string',
						default: '',
						description: 'Filter templates by tags',
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

			// HTML content for HTML to PDF conversion
			{
				displayName: 'HTML Content',
				name: 'htmlContent',
				type: 'string',
				typeOptions: {
					rows: 10,
					validation: [
						{
							type: 'minLength',
							properties: {
								minLength: 10,
								errorMessage: 'HTML content must be at least 10 characters long',
							},
						},
					],
				},
				required: true,
				displayOptions: {
					show: {
						resource: ['conversion'],
						conversionOperation: ['htmlToPdf'],
					},
				},
				default: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample PDF Document</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #007acc;
            padding-bottom: 10px;
        }
        h2 {
            color: #555;
            margin-top: 30px;
        }
        .highlight {
            background-color: #f0f8ff;
            padding: 15px;
            border-left: 4px solid #007acc;
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
    </style>
</head>
<body>
    <h1>Sample PDF Document</h1>

    <p>This is a sample HTML document that will be converted to PDF. You can customize this content with your own HTML, CSS, and data.</p>

    <div class="highlight">
        <strong>Tip:</strong> You can use CSS styles to format your PDF output with fonts, colors, layouts, and more.
    </div>

    <h2>Features</h2>
    <ul>
        <li>Custom fonts and styling</li>
        <li>Tables and layouts</li>
        <li>Images and graphics</li>
        <li>Professional formatting</li>
    </ul>

    <h2>Sample Table</h2>
    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Price</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Product A</td>
                <td>High-quality product</td>
                <td>$29.99</td>
            </tr>
            <tr>
                <td>Product B</td>
                <td>Premium service</td>
                <td>$49.99</td>
            </tr>
        </tbody>
    </table>

    <p><em>Replace this content with your own HTML to generate custom PDFs.</em></p>
</body>
</html>`,
				description: 'HTML content to convert to PDF. You can replace this sample with your own HTML.',
			},

			// URL for URL to PDF conversion
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				typeOptions: {
					validation: [
						{
							type: 'regex',
							properties: {
								regex: '^https?:\\/\\/.+',
								errorMessage: 'Please enter a valid URL starting with http:// or https://',
							},
						},
					],
				},
				required: true,
				displayOptions: {
					show: {
						resource: ['conversion'],
						conversionOperation: ['urlToPdf'],
					},
				},
				default: '',
				description: 'Public URL to convert to PDF',
				placeholder: 'https://example.com',
			},

			// Filename field for conversion operations
			{
				displayName: 'Filename',
				name: 'filename',
				type: 'string',
				typeOptions: {
					validation: [
						{
							type: 'minLength',
							properties: {
								minLength: 1,
								errorMessage: 'Filename cannot be empty',
							},
						},
						{
							type: 'regex',
							properties: {
								regex: '^[a-zA-Z0-9._-]+$',
								errorMessage: 'Filename can only contain letters, numbers, dots, hyphens, and underscores',
							},
						},
					],
				},
				required: true,
				displayOptions: {
					show: {
						resource: ['conversion'],
					},
				},
				default: 'document',
				description: 'Filename for the generated PDF (without .pdf extension)',
				placeholder: 'my-document',
			},

			// Additional conversion options
			{
				displayName: 'Additional Options',
				name: 'conversionOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['conversion'],
					},
				},
				options: [
					{
						displayName: 'Paper Size',
						name: 'paper_size',
						type: 'options',
						options: [
							{
								name: 'A0',
								value: 'a0',
							},
							{
								name: 'A1',
								value: 'a1',
							},
							{
								name: 'A2',
								value: 'a2',
							},
							{
								name: 'A3',
								value: 'a3',
							},
							{
								name: 'A4',
								value: 'a4',
							},
							{
								name: 'Legal',
								value: 'legal',
							},
							{
								name: 'Letter',
								value: 'letter',
							},
							{
								name: 'Tabloid',
								value: 'tabloid',
							},
						],
						default: 'a4',
						description: 'PDF page size',
					},
					{
						displayName: 'Orientation',
						name: 'orientation',
						type: 'options',
						options: [
							{
								name: 'Portrait',
								value: 'portrait',
							},
							{
								name: 'Landscape',
								value: 'landscape',
							},
						],
						default: 'portrait',
						description: 'Page orientation',
					},
					{
						displayName: 'Output Format',
						name: 'output',
						type: 'options',
						options: [
							{
								name: 'Base64 (JSON)',
								value: 'base64',
								description: 'Returns JSON response with base64 string',
							},
							{
								name: 'File (Binary)',
								value: 'file',
								description: 'Returns binary file data for download/attachment',
							},
						],
						default: 'base64',
						description: 'Choose output format: JSON with base64 string or binary file',
					},
				],
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
		let operation: string;

		// Get the appropriate operation parameter based on the resource
		switch (resource) {
			case 'conversion':
				operation = this.getNodeParameter('conversionOperation', 0) as string;
				break;
			case 'document':
				operation = this.getNodeParameter('documentOperation', 0) as string;
				break;
			case 'pdfServices':
				operation = this.getNodeParameter('pdfServicesOperation', 0) as string;
				break;
			case 'template':
			case 'workspace':
			default:
				operation = this.getNodeParameter('operation', 0) as string;
		}

		// Get credentials to get the configurable baseURL
		const credentials = await this.getCredentials('pdfGeneratorApi');
		const baseURL = (credentials.baseUrl as string) || 'https://us1.pdfgeneratorapi.com/api/v4';

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData;

				if (resource === 'conversion') {
					const conversionOptions = this.getNodeParameter('conversionOptions', i, {}) as any;
					const filename = this.getNodeParameter('filename', i) as string;

					// Validate required fields
					if (!filename || filename.trim() === '') {
						throw new NodeOperationError(
							this.getNode(),
							'Filename is required for conversion operations',
							{ itemIndex: i },
						);
					}

					if (operation === 'htmlToPdf') {
						const htmlContent = this.getNodeParameter('htmlContent', i) as string;
						if (!htmlContent || htmlContent.trim() === '') {
							throw new NodeOperationError(
								this.getNode(),
								'HTML Content is required for HTML to PDF conversion',
								{ itemIndex: i },
							);
						}
						if (htmlContent.length < 10) {
							throw new NodeOperationError(
								this.getNode(),
								'HTML Content must be at least 10 characters long',
								{ itemIndex: i },
							);
						}
					}

					if (operation === 'urlToPdf') {
						const url = this.getNodeParameter('url', i) as string;
						if (!url || url.trim() === '') {
							throw new NodeOperationError(
								this.getNode(),
								'URL is required for URL to PDF conversion',
								{ itemIndex: i },
							);
						}
						if (!url.match(/^https?:\/\/.+/)) {
							throw new NodeOperationError(
								this.getNode(),
								'Please enter a valid URL starting with http:// or https://',
								{ itemIndex: i },
							);
						}
					}

					// Build request body
					const body: any = {
						paper_size: conversionOptions.paper_size || 'a4',
						orientation: conversionOptions.orientation || 'portrait',
						output: conversionOptions.output || 'base64',
						filename: filename || 'document',
					};

					if (operation === 'htmlToPdf') {
						// HTML to PDF conversion
						const htmlContent = this.getNodeParameter('htmlContent', i) as string;
						body.content = htmlContent;

						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: '/conversion/html2pdf',
							body,
							json: body.output !== 'file', // Don't parse as JSON when expecting raw binary
							encoding: body.output === 'file' ? null : 'utf8', // Handle binary data correctly
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);
					} else if (operation === 'urlToPdf') {
						// URL to PDF conversion
						const url = this.getNodeParameter('url', i) as string;
						body.url = url;

						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: '/conversion/url2pdf',
							body,
							json: body.output !== 'file', // Don't parse as JSON when expecting raw binary
							encoding: body.output === 'file' ? null : 'utf8', // Handle binary data correctly
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);
					}

										// Handle output based on what the API actually returns
					if (responseData) {
						const outputFormat = body.output || 'base64';

												if (outputFormat === 'file') {
							// For file output, API returns raw binary PDF data
							const binaryData: any = {};
							const fileName = `${filename}.pdf`;

							// When json=false and encoding=null, responseData is the raw binary buffer
							const binaryBuffer = Buffer.isBuffer(responseData) ? responseData : Buffer.from(responseData);

							console.log(`Raw PDF buffer size: ${binaryBuffer.length} bytes`);

							binaryData[fileName] = await this.helpers.prepareBinaryData(
								binaryBuffer,
								fileName,
								'application/pdf'
							);

							returnData.push({
								json: {
									success: true,
									filename: `${filename}.pdf`,
									format: outputFormat,
									fileSize: binaryBuffer.length,
								},
								binary: binaryData,
							});
						} else {
							// base64 and url formats return JSON only
							returnData.push({
								json: {
									success: true,
									filename: `${filename}.pdf`,
									format: outputFormat,
									...responseData,
								},
							});
						}
						continue;
					}
				} else if (resource === 'document') {
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

						await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

						// For delete operations, API returns 204 No Content on success
						// Set responseData to a success response to avoid the "operation not supported" error
						responseData = {
							success: true,
							message: 'Document deleted successfully',
							publicId: publicId,
						};

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
							json: output !== 'file', // Don't parse as JSON when expecting raw binary
							encoding: output === 'file' ? null : 'utf8', // Handle binary data correctly
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

						// Handle output based on format for document generation
						if (responseData && output !== 'url') {
							if (output === 'file') {
								// For file output, API returns raw binary data
								const binaryData: any = {};
								const fileName = `${additionalFields.outputName || 'document'}.${format}`;

								// When json=false and encoding=null, responseData is the raw binary buffer
								const binaryBuffer = Buffer.isBuffer(responseData) ? responseData : Buffer.from(responseData);

								binaryData[fileName] = await this.helpers.prepareBinaryData(
									binaryBuffer,
									fileName,
									format === 'pdf' ? 'application/pdf' : `application/${format}`
								);

								returnData.push({
									json: {
										success: true,
										filename: fileName,
										format: output,
										fileSize: binaryBuffer.length,
									},
									binary: binaryData,
								});
								continue;
							} else {
								// base64 and url formats return JSON only
								returnData.push({
									json: {
										success: true,
										filename: `${additionalFields.outputName || 'document'}.${format}`,
										format: output,
										...responseData,
									},
								});
								continue;
							}
						}

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

						// Handle output based on format for batch generation
						if (responseData && output !== 'url') {
							if (output === 'file') {
								// Only file format returns binary data
								// Check if response data exists and handle different response structures
								let fileData = responseData.response || responseData.data || responseData;

								if (!fileData) {
									throw new NodeOperationError(
										this.getNode(),
										`No file data received from API. Response structure: ${JSON.stringify(Object.keys(responseData))}`,
										{ itemIndex: i },
									);
								}

								const binaryData: any = {};
								const fileName = `${additionalFields.outputName || 'batch-documents'}.${format}`;

								// Handle different data formats
								let binaryBuffer: Buffer;
								if (typeof fileData === 'string') {
									// If it's a base64 string, decode it
									if (fileData.startsWith('data:')) {
										// Handle data URI format
										const base64Data = fileData.split(',')[1];
										binaryBuffer = Buffer.from(base64Data, 'base64');
									} else {
										// Assume it's base64
										binaryBuffer = Buffer.from(fileData, 'base64');
									}
								} else if (Buffer.isBuffer(fileData)) {
									binaryBuffer = fileData;
								} else {
									// Try to convert to buffer assuming it's binary
									binaryBuffer = Buffer.from(fileData);
								}

								binaryData[fileName] = await this.helpers.prepareBinaryData(
									binaryBuffer,
									fileName,
									format === 'pdf' ? 'application/pdf' : `application/${format}`
								);

								returnData.push({
									json: {
										success: true,
										filename: fileName,
										format: output,
										...responseData.meta,
									},
									binary: binaryData,
								});
								continue;
							} else {
								// base64 and url formats return JSON only
								returnData.push({
									json: {
										success: true,
										filename: `${additionalFields.outputName || 'batch-documents'}.${format}`,
										format: output,
										...responseData,
									},
								});
								continue;
							}
						}

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
						const templateConfiguration = this.getNodeParameter('templateConfiguration', i) as string;

						const body = JSON.parse(templateConfiguration);

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
						const templateConfiguration = this.getNodeParameter('templateConfiguration', i) as string;

						const body = JSON.parse(templateConfiguration);

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

						await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

						// For delete operations, API returns 204 No Content on success
						responseData = {
							success: true,
							message: 'Template deleted successfully',
							templateId: templateId,
						};

					} else if (operation === 'validate') {
						// Validate template configuration
						const templateConfig = this.getNodeParameter('templateConfig', i);

						// Handle both string and object inputs
						const body = typeof templateConfig === 'string' ? JSON.parse(templateConfig) : templateConfig;

						// Validate that the body is an object and has required properties
						if (!body || typeof body !== 'object') {
							throw new NodeOperationError(this.getNode(), 'Template configuration must be a valid JSON object', { itemIndex: i });
						}

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

				} else if (resource === 'pdfServices') {
					// PDF Services operations
					const pdfSource = this.getNodeParameter('pdfSource', i) as string;
					const outputFormat = this.getNodeParameter('outputFormat', i, 'base64') as string;

					// Build request body with PDF source
					const body: any = {};
					if (pdfSource === 'url') {
						body.file_url = this.getNodeParameter('fileUrl', i) as string;
					} else {
						body.file_base64 = this.getNodeParameter('fileBase64', i) as string;
					}

					// Add output format to body (required by API)
					body.output = outputFormat;

															if (operation === 'addWatermark') {
						// Add watermark to PDF
						const watermarkTypes = this.getNodeParameter('watermarkType', i) as string[];
						const textOptions = this.getNodeParameter('textWatermarkOptions', i, {}) as any;
						const imageOptions = this.getNodeParameter('imageWatermarkOptions', i, {}) as any;

						// Build watermark configuration object according to API spec
						const watermark: any = {};

						// Add text watermark if selected
						if (watermarkTypes.includes('text')) {
							const textContent = this.getNodeParameter('watermarkText', i) as string;
							if (!textContent) {
								throw new NodeOperationError(this.getNode(), 'Watermark text is required when Text watermark type is selected');
							}
							watermark.text = {
								content: textContent
							};

							// Add text-specific options
							if (textOptions.color) watermark.text.color = textOptions.color;
							if (textOptions.size !== undefined) watermark.text.size = textOptions.size;
							if (textOptions.opacity !== undefined) watermark.text.opacity = textOptions.opacity;
							if (textOptions.position) watermark.text.position = textOptions.position;
							if (textOptions.rotation !== undefined) watermark.text.rotation = textOptions.rotation;
						}

						// Add image watermark if selected
						if (watermarkTypes.includes('image')) {
							const imageUrl = this.getNodeParameter('watermarkImageUrl', i) as string;
							if (!imageUrl) {
								throw new NodeOperationError(this.getNode(), 'Watermark image URL is required when Image watermark type is selected');
							}
							watermark.image = {
								content_url: imageUrl
							};

							// Add image-specific options
							if (imageOptions.position) watermark.image.position = imageOptions.position;
							if (imageOptions.rotation !== undefined) watermark.image.rotation = imageOptions.rotation;
							if (imageOptions.scale !== undefined) watermark.image.scale = imageOptions.scale;
						}

						// Validate that at least one watermark type is selected
						if (!watermarkTypes.length || (!watermark.text && !watermark.image)) {
							throw new NodeOperationError(this.getNode(), 'At least one watermark type (text or image) must be selected and configured');
						}

						// Add watermark object to body
						body.watermark = watermark;

						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: '/pdfservices/watermark',
							body,
							json: outputFormat !== 'file',
							encoding: outputFormat === 'file' ? null : 'utf8',
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

										} else if (operation === 'encrypt') {
						// Encrypt PDF document
						const ownerPassword = this.getNodeParameter('ownerPassword', i) as string;
						const userPassword = this.getNodeParameter('userPassword', i) as string;

						if (ownerPassword) body.owner_password = ownerPassword;
						if (userPassword) body.user_password = userPassword;

						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: '/pdfservices/encrypt',
							body,
							json: outputFormat !== 'file',
							encoding: outputFormat === 'file' ? null : 'utf8',
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

										} else if (operation === 'decrypt') {
						// Decrypt PDF document
						const decryptionPassword = this.getNodeParameter('decryptionPassword', i) as string;

						if (decryptionPassword) body.owner_password = decryptionPassword;

						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: '/pdfservices/decrypt',
							body,
							json: outputFormat !== 'file',
							encoding: outputFormat === 'file' ? null : 'utf8',
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'extractFormFields') {
						// Extract form fields from PDF document
						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: '/pdfservices/form/fields',
							body,
							json: true, // Always return JSON for form fields extraction
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'fillFormFields') {
						// Fill form fields in PDF document
						const formFieldsData = this.getNodeParameter('formFieldsData', i) as string;

						// Parse the JSON data
						let parsedData;
						try {
							parsedData = typeof formFieldsData === 'string' ? JSON.parse(formFieldsData) : formFieldsData;
						} catch (error) {
							throw new NodeOperationError(this.getNode(), 'Form Fields Data must be valid JSON');
						}

						// Add form data to the request body
						body.data = parsedData;

						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: '/pdfservices/form/fill',
							body,
							json: outputFormat !== 'file',
							encoding: outputFormat === 'file' ? null : 'utf8',
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);

					} else if (operation === 'optimize') {
						// Optimize PDF document
						const options: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							baseURL,
							url: '/pdfservices/optimize',
							body,
							json: outputFormat !== 'file',
							encoding: outputFormat === 'file' ? null : 'utf8',
							resolveWithFullResponse: true, // Get headers for optimization stats
						};

						const fullResponse = await this.helpers.requestWithAuthentication.call(this, 'pdfGeneratorApi', options);
						responseData = fullResponse.body;

						// Extract optimization statistics from headers
						const headers = fullResponse.headers || {};
						const originalSize = headers['x-original-size'] ? parseInt(headers['x-original-size'], 10) : null;
						const optimizedSize = headers['x-optimized-size'] ? parseInt(headers['x-optimized-size'], 10) : null;

						// Store stats for later use in response
						(responseData as any).__optimizationStats = {
							originalSize,
							optimizedSize,
							compressionRatio: originalSize && optimizedSize ? ((originalSize - optimizedSize) / originalSize * 100) : null
						};
					}

					// Handle PDF Services response based on output format
					if (responseData) {
						// Special handling for extractFormFields - always returns JSON
						if (operation === 'extractFormFields') {
							returnData.push({
								json: {
									success: true,
									operation,
									...responseData,
								},
							});
						} else if (outputFormat === 'file') {
							// For file output, API returns raw binary PDF data
							const binaryData: any = {};
							const fileName = `processed-document.pdf`;

							const binaryBuffer = Buffer.isBuffer(responseData) ? responseData : Buffer.from(responseData);

							binaryData[fileName] = await this.helpers.prepareBinaryData(
								binaryBuffer,
								fileName,
								'application/pdf'
							);

							// Prepare JSON response with optimization stats if available
							const jsonResponse: any = {
								success: true,
								operation,
								filename: fileName,
								format: outputFormat,
								fileSize: binaryBuffer.length,
							};

							// Add optimization statistics if this is an optimize operation
							if (operation === 'optimize' && (responseData as any).__optimizationStats) {
								const stats = (responseData as any).__optimizationStats;
								jsonResponse.optimizationStats = {
									originalSize: stats.originalSize,
									optimizedSize: stats.optimizedSize,
									savedBytes: stats.originalSize && stats.optimizedSize ? stats.originalSize - stats.optimizedSize : null,
									compressionRatio: stats.compressionRatio ? `${stats.compressionRatio.toFixed(2)}%` : null
								};
							}

							returnData.push({
								json: jsonResponse,
								binary: binaryData,
							});
						} else {
							// base64 and url formats return JSON only
							const jsonResponse: any = {
								success: true,
								operation,
								format: outputFormat,
								...responseData,
							};

							// Add optimization statistics if this is an optimize operation
							if (operation === 'optimize' && (responseData as any).__optimizationStats) {
								const stats = (responseData as any).__optimizationStats;
								jsonResponse.optimizationStats = {
									originalSize: stats.originalSize,
									optimizedSize: stats.optimizedSize,
									savedBytes: stats.originalSize && stats.optimizedSize ? stats.originalSize - stats.optimizedSize : null,
									compressionRatio: stats.compressionRatio ? `${stats.compressionRatio.toFixed(2)}%` : null
								};
								// Remove internal stats object from response
								delete jsonResponse.__optimizationStats;
							}

							returnData.push({
								json: jsonResponse,
							});
						}
						continue;
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



