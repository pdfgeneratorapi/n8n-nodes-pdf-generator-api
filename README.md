# n8n-nodes-pdf-generator-api

This is an n8n community node. It lets you use PDF Generator API in your n8n workflows.

PDF Generator API is a powerful service that allows you to generate PDFs from templates, convert HTML/URLs to PDF, and perform various PDF operations like watermarking, encryption, optimization, and form field manipulation.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Version history](#version-history)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

Use the package name: `n8n-nodes-pdf-generator-api`

## Operations

This node supports the following operations organized by resource:

### Document
- **Generate** - Generate a PDF document from a template with data
- **Generate (Async)** - Generate a PDF document asynchronously with callback
- **Generate (Batch)** - Generate multiple PDF documents in batch
- **Generate (Batch + Async)** - Generate multiple PDF documents in batch asynchronously
- **List** - List generated documents stored in the API
- **Get** - Retrieve a specific document by public ID
- **Delete** - Delete a document from storage

### Template
- **Create** - Create a new PDF template
- **Update** - Update an existing template configuration
- **Get** - Retrieve template configuration
- **Delete** - Delete a template
- **List** - List available templates
- **Copy** - Create a copy of an existing template
- **Get Data Fields** - Extract data fields used in a template
- **Open Editor** - Get URL to open template editor
- **Validate** - Validate template configuration

### Conversion
- **HTML to PDF** - Convert HTML content directly to PDF
- **URL to PDF** - Convert a public URL to PDF

### PDF Services
- **Add Watermark** - Add text or image watermarks to PDF documents
- **Encrypt Document** - Encrypt PDF documents with password protection
- **Decrypt Document** - Decrypt encrypted PDF documents
- **Optimize Document** - Optimize PDF file size for better performance
- **Extract Form Fields** - Extract form fields and metadata from PDF documents
- **Fill Form Fields** - Fill form fields in PDF documents with provided data

### Workspace
- **Create** - Create a new workspace for organizing templates
- **List** - List all workspaces in organization
- **Get** - Get workspace information
- **Delete** - Delete a workspace

## Credentials

To use this node, you need to authenticate with PDF Generator API:

### Prerequisites
1. Sign up for a [PDF Generator API account](https://pdfgeneratorapi.com/signup)
2. Get your API Key and API Secret from Account Settings

### Authentication Setup
1. In n8n, create new credentials for "PDF Generator API"
2. Enter your **API Key** and **API Secret**

### JWT Authentication
The node automatically handles JWT token generation using your API credentials. Tokens are generated server-side and include:
- Issuer (iss): Your API Key
- Subject (sub): Workspace identifier
- Expiration (exp): Short-lived tokens for security

## Compatibility

- **Minimum n8n version**: 0.199.0
- **Tested with**: n8n versions 0.199.0+
- **Node API version**: 1

## Usage

### Basic Document Generation
1. Select **Resource**: Document
2. Select **Operation**: Generate
3. Choose your template from the dropdown
4. Provide JSON data to merge with the template
5. Select output format (Base64, URL, or File)

### HTML to PDF Conversion
1. Select **Resource**: Conversion
2. Select **Operation**: HTML to PDF
3. Enter your HTML content
4. Configure paper size and orientation
5. Specify filename and output format

### PDF Processing
- **Watermarking**: Add text or image watermarks with positioning options
- **Encryption**: Protect PDFs with owner and user passwords
- **Decryption**: Remove password protection from encrypted PDFs
- **Optimization**: Reduce file size while maintaining quality
- **Form Fields**: Extract form field metadata and fill PDF forms with data

#### Form Fields Operations
1. **Extract Form Fields**: Analyze PDF forms to discover available fields
2. **Fill Form Fields**: Populate PDF forms with data

Example form data:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "subscribe": true
}
```

### Output Formats
- **Base64**: Returns PDF as base64 encoded string in JSON
- **URL**: Returns download URL (files stored for 30 days)
- **File**: Returns binary PDF data for direct download

### Error Handling
The node includes comprehensive error handling for:
- Authentication failures
- Invalid template configurations
- Missing required parameters
- API rate limiting
- Network connectivity issues

For workflows that should continue on errors, enable "Continue on Fail" in node settings.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [PDF Generator API Documentation](https://docs.pdfgeneratorapi.com)
* [PDF Generator API Support](https://support.pdfgeneratorapi.com)
* [Template Editor Guide](https://support.pdfgeneratorapi.com/en/category/components-1ffseaj/)
* [Expression Language Documentation](https://support.pdfgeneratorapi.com/en/category/expression-language-q203pa/)

## Version history

### 0.2.2
- 🧹 **Cleanup**: Removed example nodes and credentials from package
- 🔧 **Improved**: Build process now only includes production files
- 📦 **Optimized**: Package structure for better n8n compatibility

### 0.2.1
- 🐛 **Fixed**: Fixed npm publish script in package.json
- 📝 **Updated**: Package metadata and repository information

### 0.2.0
- ✨ **New**: Added PDF form fields operations
  - Extract Form Fields: Analyze and extract form field metadata
  - Fill Form Fields: Populate PDF forms with data
- 🐛 **Fixed**: Improved error handling for PDF services operations
- 📝 **Docs**: Enhanced documentation and examples

### 0.1.0
- 🎉 **Initial Release**: Complete PDF Generator API integration
  - Document generation from templates
  - HTML/URL to PDF conversion
  - PDF processing (watermark, encrypt, decrypt, optimize)
  - Template and workspace management
  - Support for all output formats (Base64, URL, File)
  - Comprehensive error handling and validation 
