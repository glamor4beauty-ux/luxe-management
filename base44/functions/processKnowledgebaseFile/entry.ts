import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUrl, fileName, fileType } = await req.json();

    if (!fileUrl || !fileName) {
      return Response.json({ error: 'fileUrl and fileName required' }, { status: 400 });
    }

    let extractedText = '';

    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // DOCX: use ExtractDataFromUploadedFile
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'All text content from the document' }
          }
        }
      });
      extractedText = result?.output?.content || JSON.stringify(result?.output || '');
    } else {
      // PDF, TXT: use LLM with file_urls
      extractedText = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract all text content from this file. Return the complete text content without modification. File name: ${fileName}`,
        file_urls: [fileUrl],
        model: 'automatic'
      });
    }

    // Upload extracted text as a file to avoid entity size limits
    const textBlob = new Blob([extractedText], { type: 'text/plain' });
    const textFile = new File([textBlob], `${fileName}.txt`, { type: 'text/plain' });
    const { file_url: contentUrl } = await base44.integrations.Core.UploadFile({ file: textFile });

    // Store content URL in extractedContent field
    const entry = await base44.asServiceRole.entities.KnowledgeBaseEntry.create({
      fileName,
      fileUrl,
      fileType: fileType || 'unknown',
      extractedContent: contentUrl,
      uploadedBy: user.email
    });

    return Response.json({
      success: true,
      entryId: entry.id,
      fileName: entry.fileName,
      message: 'File processed and stored successfully'
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return Response.json({
      error: error.message || 'Failed to process file'
    }, { status: 500 });
  }
});