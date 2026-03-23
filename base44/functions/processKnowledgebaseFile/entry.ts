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

    // Extract content from file using LLM vision + context
    const extractedContent = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract all text content from this file. Return the complete text content without modification. File name: ${fileName}`,
      file_urls: [fileUrl],
      model: 'automatic'
    });

    // Store in database
    const entry = await base44.asServiceRole.entities.KnowledgeBaseEntry.create({
      fileName,
      fileUrl,
      fileType: fileType || 'unknown',
      extractedContent,
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