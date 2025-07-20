# Project 9: L'Oréal Routine Builder with Web Search

L'Oréal is expanding what's possible with AI, and now your chatbot is getting smarter with real-time web search capabilities. This upgraded routine builder allows users to browse real L'Oréal brand products, select the ones they want, and generate a personalized routine using AI with access to current information.

Users can browse products, generate AI-powered routines, and ask follow-up questions about beauty topics. The AI now searches the web for current L'Oréal product information, reviews, pricing, and beauty trends, providing up-to-date responses with links and citations.

## 🆕 New Features

- **Real-time Web Search**: AI searches for current L'Oréal product information, reviews, and trends
- **Current Information**: Get latest product availability, pricing, and expert recommendations
- **Links & Citations**: Responses include relevant links and sources for further reading
- **Smart Model Selection**: Automatically selects the best available search-enabled AI model

## Technical Details

The chatbot now uses advanced AI models like DeepSeek-R1 that support web search capabilities. When users ask about L'Oréal products, the AI searches the web for current information and includes relevant links and citations in responses.

### Supported Models (in priority order):
1. \deepseek-r1:7b\ - Advanced reasoning with search capabilities
2. \searx-llama\ - Explicitly search-enabled model
3. \llama3.2:3b\ - General purpose with search support
4. \gemma3:12b\ - Large context model
5. \gemma3:4b\ - Fallback option

## Setup

1. Ensure your Ollama server has search-enabled models installed:
   \\\ash
   ollama pull deepseek-r1:7b
   \\\

2. Configure CORS for web access:
   \\\ash
   export OLLAMA_ORIGINS=\
*\
   ollama serve
   \\\

3. Open \index.html\ in your browser to start using the enhanced routine builder!
