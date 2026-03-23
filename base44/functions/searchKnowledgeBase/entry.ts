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
      return Response.json({ error: 'query required' }, { status: 400 });
    }

    // Fetch ALL knowledge base entries
    const allEntries = await base44.asServiceRole.entities.KnowledgeBaseEntry.list('-created_date', 1000);

    if (allEntries.length === 0) {
      return Response.json({
        success: true,
        answer: 'No documents available in the knowledge base. Please upload documents first.'
      });
    }

    // Fetch content for each entry (may be a URL or inline text)
    const contents = await Promise.all(allEntries.map(async (entry) => {
      let text = entry.extractedContent || '';
      if (text.startsWith('http')) {
        try {
          const res = await fetch(text);
          text = await res.text();
        } catch (e) {
          text = '';
        }
      }
      return `[From: ${entry.fileName}]\n${text}`;
    }));

    const combinedContent = contents.join('\n\n---\n\n');

    const answer = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Megan, a helpful assistant for LUXE Talent Systems. 
      
A performer is asking: "${query}"

Below is all available documentation. Search through it and provide a helpful, accurate answer based on what you find. If the answer is not in the documentation, say so and provide general guidance.

---DOCUMENTATION START---
${combinedContent}
---DOCUMENTATION END---

Provide a clear, conversational answer.`,
      model: 'automatic'
    });

    return Response.json({
      success: true,
      answer,
      docsSearched: allEntries.length
    });
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return Response.json({
      error: error.message || 'Failed to search knowledge base'
    }, { status: 500 });
  }
});