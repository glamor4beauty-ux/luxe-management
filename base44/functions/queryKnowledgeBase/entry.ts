import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();

    if (!query || query.trim().length === 0) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    // Fetch all knowledge base entries
    const entries = await base44.asServiceRole.entities.KnowledgeBaseEntry.list('', 1000);

    if (entries.length === 0) {
      return Response.json({
        success: true,
        answer: 'No documents in the knowledge base yet. Please upload documents first.',
        sources: []
      });
    }

    // Combine all content for context
    const combinedContent = entries
      .map(e => `[${e.fileName}]\n${e.extractedContent}`)
      .join('\n\n---\n\n');

    // Query with LLM using knowledge base as context
    const answer = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a helpful assistant. Answer the following question based ONLY on the provided documents. If the answer is not in the documents, say so clearly.

Documents:
${combinedContent}

User Question: ${query}

Provide a clear, concise answer with relevant details from the documents.`,
      model: 'automatic'
    });

    // Find relevant sources
    const relevantSources = entries.filter(e => {
      const content = e.extractedContent.toLowerCase();
      const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3);
      return keywords.some(k => content.includes(k));
    }).slice(0, 3);

    return Response.json({
      success: true,
      answer,
      sources: relevantSources.map(s => ({
        id: s.id,
        fileName: s.fileName,
        title: s.title,
        category: s.category
      }))
    });
  } catch (error) {
    console.error('Error querying knowledge base:', error);
    return Response.json({
      error: error.message || 'Failed to query knowledge base'
    }, { status: 500 });
  }
});