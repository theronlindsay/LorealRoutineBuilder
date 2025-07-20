/* Chat functionality and OpenAI integration */
const OPENAI_API_KEY = env.OPENAI_API_KEY; // This should be set in your environment variables
/* Array to store conversation history */
let conversationHistory = [
  {
    role: 'system',
    content: 'You are a helpful beauty and skincare expert for L\'Oréal products. You can only discuss topics related to skincare, haircare, makeup, fragrance, beauty routines, and related beauty/cosmetic topics. If asked about unrelated topics, politely redirect the conversation back to beauty and personal care. Provide clear, practical advice and remember the full conversation context.'
  }
];

/* Simple markdown parser for chat messages */
function parseMarkdown(text) {
  return text
    // Bold text **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic text *text* or _text_
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Code blocks ```code```
    .replace(/```(.*?)```/gs, '<code class="code-block">$1</code>')
    // Inline code `code`
    .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
    // Line breaks
    .replace(/\n/g, '<br>');
}

/* Handle chat messages (follow-up questions) */
async function handleChatMessage(userMessage) {
  const chatWindow = document.getElementById("chatWindow");
  
  /* Add user message to conversation history */
  conversationHistory.push({
    role: 'user',
    content: userMessage
  });

  /* Display user message in chat */
  const userMessageDiv = document.createElement('div');
  userMessageDiv.className = 'chat-message user-message';
  userMessageDiv.innerHTML = `
    <div class="message-content">
      ${parseMarkdown(userMessage)}
    </div>
    <div class="message-time">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
  `;
  chatWindow.appendChild(userMessageDiv);

  /* Show loading message */
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'chat-message ai-message loading';
  loadingDiv.innerHTML = `
    <div class="message-content">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  chatWindow.appendChild(loadingDiv);

  /* Scroll to bottom */
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    /* Make API call with full conversation history */
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: conversationHistory,
        max_tokens: 800,
        temperature: 0.7
      })
    });

    /* Remove loading message */
    chatWindow.removeChild(loadingDiv);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    /* Add AI response to conversation history */
    conversationHistory.push({
      role: 'assistant',
      content: aiResponse
    });

    /* Display AI response */
    const responseDiv = document.createElement('div');
    responseDiv.className = 'chat-message ai-message';
    responseDiv.innerHTML = `
      <div class="message-content">
        ${parseMarkdown(aiResponse)}
      </div>
      <div class="message-time">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    chatWindow.appendChild(responseDiv);

    /* Scroll to bottom */
    chatWindow.scrollTop = chatWindow.scrollHeight;

  } catch (error) {
    /* Remove loading message */
    if (loadingDiv.parentNode) {
      chatWindow.removeChild(loadingDiv);
    }

    console.error('Error in chat:', error);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'chat-message ai-message error';
    errorDiv.innerHTML = `
      <div class="message-content">
        <i class="fa-solid fa-exclamation-triangle"></i> Sorry, there was an error. Please try again.
      </div>
      <div class="message-time">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    chatWindow.appendChild(errorDiv);
  }
}

/* Generate initial routine from selected products */
async function generateRoutineFromProducts() {
  const chatWindow = document.getElementById("chatWindow");
  
  /* Check if user has selected any products */
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = `
      <div class="chat-prompt">
        <i class="fa-solid fa-hand-sparkles"></i> Please select some products first to generate a routine.
      </div>
    `;
    return;
  }

  /* Clear previous conversation and start fresh with routine generation */
  chatWindow.innerHTML = '';
  
  /* Reset conversation history but keep system message */
  conversationHistory = [conversationHistory[0]]; // Keep only system message

  /* Show loading message without text */
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'chat-message ai-message loading';
  loadingDiv.innerHTML = `
    <div class="message-content">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  chatWindow.appendChild(loadingDiv);

  try {
    /* Prepare the selected products data for OpenAI */
    const productsData = selectedProducts.map(product => ({
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description
    }));

    /* Create the prompt for OpenAI */
    const userMessage = `Please create a personalized skincare/beauty routine using these products:

${productsData.map(product => 
  `- ${product.name} by ${product.brand} (${product.category}): ${product.description}`
).join('\n')}

Please provide:
1. A step-by-step routine (morning and/or evening)
2. The order of application
3. Any tips for best results
4. Frequency recommendations

Keep the response friendly and easy to follow.`;

    /* Add to conversation history */
    conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    /* Make API call to OpenAI */
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}` // This comes from secrets.js
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: conversationHistory,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    /* Remove loading message */
    chatWindow.removeChild(loadingDiv);

    /* Check if the API call was successful */
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    /* Get the response data */
    const data = await response.json();
    
    /* Extract the AI-generated routine */
    const routine = data.choices[0].message.content;

    /* Add AI response to conversation history */
    conversationHistory.push({
      role: 'assistant',
      content: routine
    });

    /* Display the routine in the chat window */
    const routineDiv = document.createElement('div');
    routineDiv.className = 'chat-message ai-message initial-routine';
    routineDiv.innerHTML = `
      <div class="message-content">
        ${parseMarkdown(routine)}
      </div>
      <div class="message-time">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    chatWindow.appendChild(routineDiv);

    /* Add follow-up prompt */
    const promptDiv = document.createElement('div');
    promptDiv.className = 'chat-prompt';
    promptDiv.innerHTML = `
      <i class="fa-solid fa-comments"></i> Ask me about skincare, hair care, or makeup recommendations...
    `;
    chatWindow.appendChild(promptDiv);

  } catch (error) {
    /* Remove loading message */
    if (loadingDiv.parentNode) {
      chatWindow.removeChild(loadingDiv);
    }

    /* Handle any errors */
    console.error('Error generating routine:', error);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'chat-message ai-message error';
    errorDiv.innerHTML = `
      <div class="message-content">
        <i class="fa-solid fa-exclamation-triangle"></i> Sorry, there was an error generating your routine. Please check your API key and try again.
      </div>
      <div class="message-time">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    chatWindow.appendChild(errorDiv);
  }
}
