/* Chat functionality with web search using ollama-web-search plugin and gemma3:4b */

/* Ollama server configuration */
const OLLAMA_PRIMARY_URL = 'https://ollama.theronlindsay.dev';
const OLLAMA_FALLBACK_URL = 'http://localhost:11434';

/* Array to store conversation history */
let conversationHistory = [
  {
    role: 'system',
    content: 'You are a helpful beauty and skincare expert for L\'Oréal products with access to real-time web search. When users ask about L\'Oréal products, new releases, current prices, reviews, or beauty trends, search the web for the most current information. Always include relevant links and citations in your responses when you find current information online. You can only discuss topics related to skincare, haircare, makeup, fragrance, beauty routines, and related beauty/cosmetic topics. If asked about unrelated topics, politely redirect the conversation back to beauty and personal care. Provide clear, practical advice with current information and remember the full conversation context. Respond in the same language as the user\'s question and adjust your formatting appropriately for RTL languages when needed.'
  }
];

/* RTL language detection */
function detectRTL(text) {
  // Common RTL language patterns and Unicode ranges
  const rtlPatterns = [
    /[\u0590-\u05FF]/, // Hebrew
    /[\u0600-\u06FF]/, // Arabic
    /[\u0750-\u077F]/, // Arabic Supplement
    /[\u08A0-\u08FF]/, // Arabic Extended-A
    /[\uFB50-\uFDFF]/, // Arabic Presentation Forms-A
    /[\uFE70-\uFEFF]/, // Arabic Presentation Forms-B
    /[\u200F]/, // Right-to-Left Mark
    /[\u202E]/, // Right-to-Left Override
  ];
  
  return rtlPatterns.some(pattern => pattern.test(text));
}

/* Apply RTL layout based on detected language */
function applyRTLLayout(isRTL) {
  const html = document.documentElement;
  
  if (isRTL) {
    html.setAttribute('dir', 'rtl');
    html.setAttribute('lang', 'ar'); // Default to Arabic, could be enhanced
  } else {
    html.setAttribute('dir', 'ltr');
    html.setAttribute('lang', 'en');
  }
}

/* Find a working Ollama server */
async function findWorkingServer() {
  const urlsToTry = [OLLAMA_PRIMARY_URL, OLLAMA_FALLBACK_URL];
  
  for (const url of urlsToTry) {
    try {
      console.log(`🔍 Testing connection to: ${url}`);
      const response = await fetch(`${url}/api/tags`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors', // Explicitly request CORS
        signal: AbortSignal.timeout(15000) // Increased to 15 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Connected to Ollama server at: ${url}`);
        console.log(`📦 Available models: ${data.models?.length || 0}`);
        
        // Check if our target model exists
        const hasModel = data.models?.some(model => model.name === 'gemma3:4b');
        if (!hasModel) {
          console.warn(`⚠️ Model 'gemma3:4b' not found on ${url}. Available models:`, 
            data.models?.map(m => m.name) || []);
        }
        
        return url;
      } else if (response.status === 403) {
        console.warn(`🚫 403 Forbidden from ${url} - CORS or access policy issue, trying next server...`);
        continue;
      } else {
        console.warn(`❌ HTTP ${response.status} from ${url}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn(`❌ Failed to connect to ${url}:`, error.message);
      
      // Log more specific error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn(`   → Network error: ${url} might be unreachable`);
      } else if (error.name === 'AbortError') {
        console.warn(`   → Timeout: ${url} took too long to respond`);
      }
    }
  }
  
  // If we get here, no servers worked
  throw new Error(`Unable to connect to any Ollama server. Tried: ${urlsToTry.join(', ')}.

🔧 Troubleshooting steps:
1. Remote server (${OLLAMA_PRIMARY_URL}):
   - Check if server is running
   - Verify CORS: export OLLAMA_ORIGINS="*" && ollama serve
   - Test manually: curl ${OLLAMA_PRIMARY_URL}/api/tags

2. Local server (${OLLAMA_FALLBACK_URL}):
   - Start Ollama: ollama serve
   - Pull model: ollama pull gemma3:4b
   - Install web search: https://github.com/GaryKu0/ollama-web-search
   - Test manually: curl ${OLLAMA_FALLBACK_URL}/api/tags`);
}

/* Get the model to use (gemma3:4b with web search plugin) */
async function getSearchModel(serverUrl) {
  try {
    const response = await fetch(`${serverUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });
    
    if (response.ok) {
      const data = await response.json();
      const modelNames = data.models?.map(m => m.name) || [];
      
      // Check if gemma3:4b is available
      if (modelNames.includes('gemma3:4b')) {
        console.log(`🔍 Using gemma3:4b with web search capabilities`);
        return 'gemma3:4b';
      }
      
      // Fallback to first available model if gemma3:4b is not found
      if (modelNames.length > 0) {
        console.warn(`⚠️ gemma3:4b not found, using: ${modelNames[0]}`);
        return modelNames[0];
      }
    }
  } catch (error) {
    console.warn('Error checking available models:', error.message);
  }
  
  // Final fallback
  return 'gemma3:4b';
}

/* Simple markdown parser for chat messages with link support */
function parseMarkdown(text) {
  // Process in specific order to avoid conflicts
  let processed = text
    // Bold text **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic text *text* or _text_
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Code blocks ```code``` (do this before links to avoid interference)
    .replace(/```(.*?)```/gs, '<code class="code-block">$1</code>')
    // Inline code `code`
    .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
    // Process markdown links [text](url) first
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 <i class="fa-solid fa-external-link"></i></a>');
  
  // Then process standalone URLs, but mark already processed links to avoid double-processing
  const tempMarker = '___ALREADY_LINKED___';
  processed = processed.replace(/<a [^>]*href="[^"]*"[^>]*>.*?<\/a>/g, tempMarker);
  
  // Now process standalone URLs
  processed = processed.replace(/(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1 <i class="fa-solid fa-external-link"></i></a>');
  
  // Restore the already processed links
  const linkMatches = text.match(/<a [^>]*href="[^"]*"[^>]*>.*?<\/a>/g) || [];
  let linkIndex = 0;
  processed = processed.replace(new RegExp(tempMarker, 'g'), () => linkMatches[linkIndex++] || '');
  
  // Line breaks
  processed = processed.replace(/\n/g, '<br>');
  
  return processed;
}

/* Handle chat messages (follow-up questions) */
async function handleChatMessage(userMessage) {
  const chatWindow = document.getElementById("chatWindow");
  
  /* Detect RTL and apply layout automatically */
  const isRTL = detectRTL(userMessage);
  applyRTLLayout(isRTL);
  
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
    /* Find a working Ollama server and get model */
    const serverUrl = await findWorkingServer();
    const searchModel = await getSearchModel(serverUrl);
    
    const response = await fetch(`${serverUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      mode: 'cors',
      body: JSON.stringify({
        model: searchModel,
        messages: conversationHistory,
        stream: false,
        options: {
          temperature: 0.7
        }
      })
    });

    /* Remove loading message */
    chatWindow.removeChild(loadingDiv);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.message.content;

    /* Check if AI response is also RTL and maintain layout */
    const aiIsRTL = detectRTL(aiResponse);
    if (aiIsRTL) {
      applyRTLLayout(true);
    }

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
    
    /* Provide more specific error message for different issues */
    let errorMessage = 'Sorry, there was an error. Please try again.';
    if (error.message.includes('403')) {
      errorMessage = '🚫 CORS Issue: Your remote Ollama server blocked the request. Run: export OLLAMA_ORIGINS="*" && ollama serve';
    } else if (error.message.includes('404')) {
      errorMessage = '📦 Model not found. Run: ollama pull gemma3:4b';
    } else if (error.message.includes('Failed to fetch') || error.message.includes('Unable to connect')) {
      errorMessage = '🔌 No Ollama servers available. Please start: ollama serve (locally) or fix CORS on remote server.';
    } else if (error.message.includes('CORS')) {
      errorMessage = '🚫 CORS blocked. Fix: export OLLAMA_ORIGINS="*" && ollama serve';
    }
    
    errorDiv.innerHTML = `
      <div class="message-content">
        <i class="fa-solid fa-exclamation-triangle"></i> ${errorMessage}
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

    /* Create the prompt for search-enabled AI */
    const userMessage = `Please create a personalized skincare/beauty routine using these products and search for current information about them:

${productsData.map(product => 
  `- ${product.name} by ${product.brand} (${product.category}): ${product.description}`
).join('\n')}

Please search the web for:
- Current availability and reviews of these specific products
- Latest application techniques and tips
- Any new formulations or updates to these products
- Current pricing and where to buy

Then provide:
1. A step-by-step routine (morning and/or evening) with current best practices
2. The order of application based on latest recommendations
3. Tips for best results from recent reviews and expert advice
4. Frequency recommendations
5. Include any relevant links or sources you find

Keep the response friendly and easy to follow, with citations for any current information found.`;

    /* Add to conversation history */
    conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    /* Find a working Ollama server and get model */
    const serverUrl = await findWorkingServer();
    const searchModel = await getSearchModel(serverUrl);
    
    const response = await fetch(`${serverUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      mode: 'cors',
      body: JSON.stringify({
        model: searchModel,
        messages: conversationHistory,
        stream: false,
        options: {
          temperature: 0.7
        }
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
    const routine = data.message.content;

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
      <i class="fa-solid fa-search"></i> Ask me about current L'Oréal products, latest reviews, pricing, or beauty trends...
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
    
    /* Provide more specific error message for different issues */
    let errorMessage = 'Sorry, there was an error generating your routine. Please try again.';
    if (error.message.includes('403')) {
      errorMessage = '🚫 CORS Issue: Your remote Ollama server blocked the request. Run: export OLLAMA_ORIGINS="*" && ollama serve';
    } else if (error.message.includes('404')) {
      errorMessage = '📦 Model not found. Run: ollama pull gemma3:4b';
    } else if (error.message.includes('Failed to fetch') || error.message.includes('Unable to connect')) {
      errorMessage = '🔌 No Ollama servers available. Please start: ollama serve (locally) or fix CORS on remote server.';
    } else if (error.message.includes('CORS')) {
      errorMessage = '🚫 CORS blocked. Fix: export OLLAMA_ORIGINS="*" && ollama serve';
    }
    
    errorDiv.innerHTML = `
      <div class="message-content">
        <i class="fa-solid fa-exclamation-triangle"></i> ${errorMessage}
      </div>
      <div class="message-time">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    chatWindow.appendChild(errorDiv);
  }
}
