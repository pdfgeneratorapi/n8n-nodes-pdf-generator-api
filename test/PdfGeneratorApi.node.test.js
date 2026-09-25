// Runs the built node against a fake n8n context, so no API calls are made. Build first
// (npm test does), the tests load dist.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { PdfGeneratorApi } = require('../dist/nodes/PdfGeneratorApi/PdfGeneratorApi.node.js');

// responder receives the request options and returns the full response
// ({ statusCode, body, headers }) that httpRequestWithAuthentication would
const execute = async (params, responder, { continueOnFail = false } = {}) => {
	const calls = [];
	const context = {
		getInputData: () => [{ json: {} }],
		getNodeParameter: (name, _itemIndex, fallback) => (name in params ? params[name] : fallback),
		getCredentials: async () => ({ baseUrl: 'https://api.test/v4' }),
		getNode: () => ({ id: '1', name: 'PDF Generator API', type: 'pdfGeneratorApi', typeVersion: 1, position: [0, 0], parameters: {} }),
		continueOnFail: () => continueOnFail,
		helpers: {
			httpRequestWithAuthentication: async (credentialType, options) => {
				assert.equal(credentialType, 'pdfGeneratorApi');
				calls.push(options);
				return responder(options);
			},
			prepareBinaryData: async (buffer, fileName, mimeType) => {
				assert.ok(Buffer.isBuffer(buffer), 'binary data must be a Buffer');
				return { data: buffer.toString('base64'), fileName, mimeType };
			},
			returnJsonArray: (data) => (Array.isArray(data) ? data : [data]).map((json) => ({ json })),
			constructExecutionMetaData: (items, { itemData }) => items.map((item) => ({ ...item, pairedItem: itemData })),
		},
	};
	const [output] = await new PdfGeneratorApi().execute.call(context);
	return { output, calls };
};

const executeError = async (params, responder) => {
	try {
		await execute(params, responder);
	} catch (error) {
		return error;
	}
	assert.fail('expected an error');
};

const ok = (body, headers = {}) => async () => ({ statusCode: 200, body, headers });
const status = (statusCode, body) => async () => ({ statusCode, body, headers: {} });

describe('requests', () => {
	it('sends document generate with JSON output', async () => {
		const { output, calls } = await execute(
			{ resource: 'document', operation: 'generate', templateId: '42', data: '{"a":1}', documentOutput: 'base64' },
			ok({ response: 'JVBERi0=', meta: { name: 'doc.pdf' } }),
		);

		const [options] = calls;
		assert.equal(options.method, 'POST');
		assert.equal(options.baseURL, 'https://api.test/v4');
		assert.equal(options.url, '/documents/generate');
		assert.equal(options.encoding, 'json');
		assert.deepEqual(options.body.template, { id: '42', data: { a: 1 } });
		assert.equal(output[0].json.response, 'JVBERi0=');
		assert.deepEqual(output[0].pairedItem, { item: 0 });
	});

	it('attaches a file output as binary', async () => {
		const pdf = Buffer.from('%PDF-1.7 test');
		const { output, calls } = await execute(
			{ resource: 'document', operation: 'generate', templateId: { value: '42' }, data: '{}', documentOutput: 'file' },
			ok(pdf),
		);

		assert.equal(calls[0].encoding, 'arraybuffer');
		assert.equal(output[0].json.fileSize, pdf.length);
		assert.equal(output[0].binary['document.pdf'].mimeType, 'application/pdf');
		assert.deepEqual(output[0].pairedItem, { item: 0 });
	});

	it('reads optimization stats from the response headers', async () => {
		const { output, calls } = await execute(
			{ resource: 'pdfServices', operation: 'optimize', pdfSource: 'url', fileUrl: 'https://x/a.pdf', outputFormat: 'file' },
			ok(Buffer.from('%PDF'), { 'x-original-size': '1000', 'x-optimized-size': '400' }),
		);

		assert.equal(calls[0].returnFullResponse, true);
		assert.equal(output[0].json.optimizationStats.savedBytes, 600);
		assert.equal(output[0].json.optimizationStats.compressionRatio, '60.00%');
	});

	it('reports a workspace deletion when the API returns no content', async () => {
		const { output, calls } = await execute(
			{ resource: 'workspace', operation: 'delete', workspaceIdentifier: 'a@b.com' },
			async () => ({ statusCode: 204, body: '', headers: {} }),
		);

		assert.equal(calls[0].method, 'DELETE');
		assert.equal(calls[0].url, '/workspaces/a%40b.com');
		assert.equal(output[0].json.success, true);
	});
});

describe('errors', () => {
	it('puts the e-invoice API message and field errors in the error', async () => {
		const error = await executeError(
			{ resource: 'einvoice', operation: 'createXRechnung', einvoiceData: '{}', einvoiceOutput: 'base64' },
			status(422, { message: 'The given data was invalid.', errors: { 'data.buyer': ['[BR-DE-15] Buyer reference is required'] } }),
		);

		assert.equal(error.constructor.name, 'NodeApiError');
		assert.equal(error.httpCode, '422');
		assert.equal(
			error.message,
			'PDF Generator API e-invoice request failed: The given data was invalid. (data.buyer: [BR-DE-15] Buyer reference is required)',
		);
		assert.equal(error.context.itemIndex, 0);
	});

	it('decodes an e-invoice error body received as a Buffer', async () => {
		const error = await executeError(
			{ resource: 'einvoice', operation: 'createEInvoice', einvoiceData: '{}', einvoiceOutput: 'file' },
			status(422, Buffer.from(JSON.stringify({ message: '[BR-CO-10] Sum of line amounts mismatch' }))),
		);

		assert.equal(error.httpCode, '422');
		assert.equal(error.message, 'PDF Generator API e-invoice request failed: [BR-CO-10] Sum of line amounts mismatch');
	});

	it('leaves an HTML error page out of the error', async () => {
		const error = await executeError(
			{ resource: 'einvoice', operation: 'createEInvoice', einvoiceData: '{}', einvoiceOutput: 'base64' },
			status(502, '<html><body>Bad Gateway</body></html>'),
		);

		assert.equal(error.httpCode, '502');
		assert.ok(!error.message.includes('<html>'), error.message);
		assert.ok(!String(error.description ?? '').includes('<html>'), String(error.description));
	});

	it('keeps the API message as the description for other resources', async () => {
		const error = await executeError(
			{ resource: 'template', operation: 'get', templateId: '7' },
			status(404, { message: 'Template not found' }),
		);

		assert.equal(error.constructor.name, 'NodeApiError');
		assert.equal(error.httpCode, '404');
		assert.equal(error.description, 'Template not found');
	});

	it('keeps an input error as a NodeOperationError', async () => {
		const error = await executeError(
			{ resource: 'conversion', operation: 'htmlToPdf', filename: '', conversionOptions: {} },
			ok({}),
		);

		assert.equal(error.constructor.name, 'NodeOperationError');
		assert.equal(error.message, 'Filename is required for conversion operations');
	});

	it('returns the error as an item when Continue on Fail is on', async () => {
		const { output } = await execute(
			{ resource: 'template', operation: 'get', templateId: '7' },
			status(500, { message: 'boom' }),
			{ continueOnFail: true },
		);

		assert.ok(output[0].json.error);
		assert.deepEqual(output[0].pairedItem, { item: 0 });
	});
});
