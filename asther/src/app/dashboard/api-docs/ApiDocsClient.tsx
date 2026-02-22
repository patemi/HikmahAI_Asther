"use client";

import { useState } from "react";

interface ApiDocsClientProps {
  baseUrl: string;
  bearerToken: string;
}

export default function ApiDocsClient({ baseUrl, bearerToken }: ApiDocsClientProps) {
  const [showToken, setShowToken] = useState(false);

  const markdownContent = generateMarkdown(baseUrl, bearerToken);

  function downloadMarkdown() {
    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "asther-api-docs.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const normalizedToken = (bearerToken || "").trim();
  const hasToken = normalizedToken.length > 0 && normalizedToken !== "YOUR_API_KEY";
  const maskedToken = hasToken
    ? `${normalizedToken.slice(0, 4)}...${normalizedToken.slice(-4)}`
    : "YOUR_API_KEY";
  const displayToken = showToken && hasToken ? normalizedToken : maskedToken;
  const revealedToken = hasToken ? normalizedToken : "YOUR_API_KEY";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">API Documentation</h1>
          <p className="text-sm text-stone-500 mt-1">
            Integrate Asther into your applications
          </p>
        </div>
        <button
          onClick={downloadMarkdown}
          className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 transition-colors flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download as Markdown
        </button>
      </div>

      {/* Overview */}
      <section className="bg-white border border-stone-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Overview</h2>
        <p className="text-stone-600 mb-4">
          The Asther API allows you to integrate the chatbot into your applications.
          All API requests require authentication using a Bearer token.
        </p>
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
          <p className="text-stone-500 text-sm mb-2">Base URL:</p>
          <code className="text-stone-900 font-mono">{baseUrl}/api</code>
        </div>
      </section>

      {/* Authentication */}
      <section className="bg-white border border-stone-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Authentication</h2>
        <p className="text-stone-600 mb-4">
          Include your API key in the Authorization header:
        </p>
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 flex items-center justify-between">
          <code className="text-stone-900 font-mono">
            Authorization: Bearer {displayToken}
          </code>
          <button
            type="button"
            onClick={() => {
              if (hasToken) {
                setShowToken(!showToken);
              }
            }}
            disabled={!hasToken}
            className={`text-sm ${
              hasToken
                ? "text-stone-500 hover:text-stone-700"
                : "text-stone-400 cursor-not-allowed"
            }`}
          >
            {hasToken ? (showToken ? "Hide Token" : "Show Token") : "Set Token"}
          </button>
        </div>
        {!hasToken && (
          <p className="text-stone-500 text-xs mt-2">
            Set <span className="font-mono">BEARER_TOKEN</span> in .env to reveal your API key.
          </p>
        )}
      </section>

      {/* Chat Endpoint */}
      <section className="bg-white border border-stone-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
            POST
          </span>
          <h2 className="text-lg font-medium text-stone-900 font-mono">
            /api/chat
          </h2>
        </div>
        <p className="text-stone-600 mb-4">
          Send a message to the chatbot and receive a streaming response.
        </p>

        <h3 className="text-stone-900 font-medium mt-6 mb-2">Request Body</h3>
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 overflow-x-auto">
          <pre className="text-stone-800 text-sm font-mono">
{`{
  "participantId": "unique-user-id",
  "message": "Hello, how are you?",
  "userName": "John",  // optional - the bot will address the user by this name
  "imageUrl": "https://..." // optional - image URL for analysis
}`}
          </pre>
        </div>

        <h3 className="text-stone-900 font-medium mt-4 mb-2">Parameters</h3>
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone-500">
                <th className="pb-2">Field</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Required</th>
                <th className="pb-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-stone-700">
              <tr>
                <td className="py-1 font-mono">participantId</td>
                <td>string</td>
                <td>Yes</td>
                <td>Unique identifier for the user (used for memory isolation)</td>
              </tr>
              <tr>
                <td className="py-1 font-mono">message</td>
                <td>string</td>
                <td>Yes</td>
                <td>The user&apos;s message to send to the bot</td>
              </tr>
              <tr>
                <td className="py-1 font-mono">userName</td>
                <td>string</td>
                <td>No</td>
                <td>User&apos;s display name - the bot will address them by this name</td>
              </tr>
              <tr>
                <td className="py-1 font-mono">imageUrl</td>
                <td>string</td>
                <td>No</td>
                <td>URL of an image for the bot to analyze</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-stone-900 font-medium mt-6 mb-2">Response</h3>
        <p className="text-stone-500 text-sm mb-2">
          Server-Sent Events (SSE) stream:
        </p>
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 overflow-x-auto">
          <pre className="text-stone-800 text-sm font-mono">
{`data: {"content": "Hello"}
data: {"content": "! How"}
data: {"content": " can I"}
data: {"content": " help you?"}
data: [DONE]`}
          </pre>
        </div>

        <h3 className="text-stone-900 font-medium mt-6 mb-2">cURL Example</h3>
        <div className="bg-stone-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 text-sm font-mono">
{`curl -X POST "${baseUrl}/api/chat" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${showToken ? revealedToken : "YOUR_API_KEY"}" \\
  -d '{"participantId": "user-123", "userName": "John", "message": "Hello!"}'`}
          </pre>
        </div>

        <h3 className="text-stone-900 font-medium mt-6 mb-2">JavaScript Example</h3>
        <div className="bg-stone-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 text-sm font-mono">
{`const response = await fetch('${baseUrl}/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    participantId: 'user-123',
    userName: 'John',  // optional - bot will address user by name
    message: 'Hello!',
    imageUrl: 'https://...'  // optional - for image analysis
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  const lines = text.split('\\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;
      
      const { content } = JSON.parse(data);
      console.log(content);
    }
  }
}`}
          </pre>
        </div>
      </section>

      {/* History Endpoint */}
      <section className="bg-white border border-stone-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
            GET
          </span>
          <h2 className="text-lg font-medium text-stone-900 font-mono">
            /api/chat/history
          </h2>
        </div>
        <p className="text-stone-600 mb-4">
          Retrieve conversation history for a participant.
        </p>

        <h3 className="text-stone-900 font-medium mt-6 mb-2">Query Parameters</h3>
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
          <code className="text-stone-800 font-mono">
            ?participantId=user-123&limit=50
          </code>
        </div>

        <h3 className="text-stone-900 font-medium mt-6 mb-2">cURL Example</h3>
        <div className="bg-stone-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 text-sm font-mono">
{`curl "${baseUrl}/api/chat/history?participantId=user-123&limit=50" \\
  -H "Authorization: Bearer ${showToken ? revealedToken : "YOUR_API_KEY"}"`}
          </pre>
        </div>

        <h3 className="text-stone-900 font-medium mt-6 mb-2">Response</h3>
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 overflow-x-auto">
          <pre className="text-stone-800 text-sm font-mono">
{`{
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Hello!",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Hi! How can I help?",
      "createdAt": "2024-01-01T00:00:01Z"
    }
  ]
}`}
          </pre>
        </div>
      </section>

      {/* Delete History Endpoint */}
      <section className="bg-white border border-stone-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
            DELETE
          </span>
          <h2 className="text-lg font-medium text-stone-900 font-mono">
            /api/chat/history
          </h2>
        </div>
        <p className="text-stone-600 mb-4">
          Delete conversation history for a participant.
        </p>

        <h3 className="text-stone-900 font-medium mt-6 mb-2">Request Body</h3>
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
          <pre className="text-stone-800 text-sm font-mono">
{`{
  "participantId": "user-123"
}`}
          </pre>
        </div>

        <h3 className="text-stone-900 font-medium mt-6 mb-2">cURL Example</h3>
        <div className="bg-stone-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 text-sm font-mono">
{`curl -X DELETE "${baseUrl}/api/chat/history" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${showToken ? revealedToken : "YOUR_API_KEY"}" \\
  -d '{"participantId": "user-123"}'`}
          </pre>
        </div>

        <h3 className="text-stone-900 font-medium mt-6 mb-2">Response</h3>
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
          <pre className="text-stone-800 text-sm font-mono">
{`{
  "success": true
}`}
          </pre>
        </div>
      </section>

      {/* Error Responses */}
      <section className="bg-white border border-stone-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Error Responses</h2>
        <div className="space-y-3">
          <div className="flex items-start">
            <span className="text-red-600 font-mono text-sm w-16">401</span>
            <span className="text-stone-600">Unauthorized - Invalid or missing API key</span>
          </div>
          <div className="flex items-start">
            <span className="text-amber-600 font-mono text-sm w-16">400</span>
            <span className="text-stone-600">Bad Request - Invalid request body</span>
          </div>
          <div className="flex items-start">
            <span className="text-red-600 font-mono text-sm w-16">500</span>
            <span className="text-stone-600">Internal Server Error</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function generateMarkdown(baseUrl: string, bearerToken: string): string {
  return `# Asther API Documentation

## Overview

The Asther API allows you to integrate the chatbot into your applications.
All API requests require authentication using a Bearer token.

**Base URL:** \`${baseUrl}/api\`

## Authentication

Include your API key in the Authorization header:

\`\`\`
Authorization: Bearer ${bearerToken}
\`\`\`

## Endpoints

### POST /api/chat

Send a message to the chatbot and receive a streaming response.

#### Request Body

\`\`\`json
{
  "participantId": "unique-user-id",
  "message": "Hello, how are you?",
  "userName": "John",
  "imageUrl": "https://..."
}
\`\`\`

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| participantId | string | Yes | Unique identifier for the user (used for memory isolation) |
| message | string | Yes | The user's message to send to the bot |
| userName | string | No | User's display name - the bot will address them by this name |
| imageUrl | string | No | URL of an image for the bot to analyze |

#### Response

Server-Sent Events (SSE) stream:

\`\`\`
data: {"content": "Hello"}
data: {"content": "! How"}
data: {"content": " can I"}
data: {"content": " help you?"}
data: [DONE]
\`\`\`

#### cURL Example

\`\`\`bash
curl -X POST "${baseUrl}/api/chat" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${bearerToken}" \\
  -d '{"participantId": "user-123", "userName": "John", "message": "Hello!"}'
\`\`\`

#### JavaScript Example

\`\`\`javascript
const response = await fetch('${baseUrl}/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    participantId: 'user-123',
    userName: 'John',  // optional - bot will address user by name
    message: 'Hello!',
    imageUrl: 'https://...'  // optional - for image analysis
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  const lines = text.split('\\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;
      
      const { content } = JSON.parse(data);
      console.log(content);
    }
  }
}
\`\`\`

---

### GET /api/chat/history

Retrieve conversation history for a participant.

#### Query Parameters

- \`participantId\` (required): The participant's unique identifier
- \`limit\` (optional): Maximum number of messages to return (default: 50)

#### cURL Example

\`\`\`bash
curl "${baseUrl}/api/chat/history?participantId=user-123&limit=50" \\
  -H "Authorization: Bearer ${bearerToken}"
\`\`\`

#### Response

\`\`\`json
{
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Hello!",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Hi! How can I help?",
      "createdAt": "2024-01-01T00:00:01Z"
    }
  ]
}
\`\`\`

---

### DELETE /api/chat/history

Delete conversation history for a participant.

#### Request Body

\`\`\`json
{
  "participantId": "user-123"
}
\`\`\`

#### cURL Example

\`\`\`bash
curl -X DELETE "${baseUrl}/api/chat/history" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${bearerToken}" \\
  -d '{"participantId": "user-123"}'
\`\`\`

#### Response

\`\`\`json
{
  "success": true
}
\`\`\`

---

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 401 | Unauthorized - Invalid or missing API key |
| 400 | Bad Request - Invalid request body |
| 500 | Internal Server Error |

---

*Generated by Asther*
`;
}
