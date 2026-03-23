import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUrl, fileName, fileType, title, category } = await req.json();

    if (!fileUrl || !fileName) {
      return Response.json({ error: 'fileUrl and fileName required' }, { status: 400 });
    }

    let extractedText = '';

    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // DOCX: use LLM with file_urls
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract all text content from this document. Return the complete content exactly as it appears.`,
        file_urls: [fileUrl]
      });
      extractedText = result;
    } else {
      // PDF, TXT, images: use LLM with file_urls
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract all text content from this file, including any text in images or diagrams. Return the complete content. File name: ${fileName}`,
        file_urls: [fileUrl]
      });
      extractedText = result;
    }

    const entry = await base44.asServiceRole.entities.KnowledgeBaseEntry.create({
      title: title || fileName,
      fileName,
      fileUrl,
      fileType: fileType || 'unknown',
      extractedContent: extractedText,
      uploadedBy: user.email,
      category: category || 'General'
    });

    return Response.json({
      success: true,
      entryId: entry.id,
      fileName: entry.fileName,
      message: 'Document processed successfully'
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return Response.json({
      error: error.message || 'Failed to upload document'
    }, { status: 500 });
  }
});