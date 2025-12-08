# Frontend Integration Guide - Bedrock Knowledge Base (Next.js)

This guide explains how to update your Next.js frontend to support the Bedrock Knowledge Base feature for assistants.

## Overview

The frontend needs to allow users to:
1. Toggle between document uploads and Bedrock Knowledge Base
2. Configure KB settings (ID, region, max results)
3. Display KB status and information
4. Handle validation and error messages

## Next.js Considerations

This guide uses Next.js 13+ patterns:
- **App Router** for routing
- **Server Components** for data fetching
- **Client Components** for interactivity
- **Server Actions** for mutations (optional)
- **TypeScript** for type safety

## Backend API Changes

### Assistant Creation/Update Endpoint

**Endpoint**: `POST /assistant/create`

**New Fields in Request**:
```typescript
interface CreateAssistantRequest {
  data: {
    name: string;
    description: string;
    instructions: string;
    disclaimer: string;
    tags: string[];
    dataSources: DataSource[];
    data?: {
      // NEW: Bedrock KB Configuration
      useBedrockKnowledgeBase?: boolean;
      bedrockKnowledgeBaseId?: string;
      bedrockKnowledgeBaseRegion?: string;
      bedrockKnowledgeBaseMaxResults?: number;
      
      // Existing fields...
      dataSourceOptions?: object;
      messageOptions?: object;
      // ... other existing fields
    };
  };
}
```

**Response** (unchanged):
```typescript
interface CreateAssistantResponse {
  success: boolean;
  message: string;
  data: {
    assistantId: string;
    id: string;
    version: number;
    data_sources: DataSource[];
    ast_data: object;
  };
}
```

## UI Components Needed

### 1. Knowledge Base Toggle Section (Client Component)

Add this to your assistant creation/edit form. This must be a Client Component due to interactivity.

**File**: `components/assistant/KnowledgeBaseSection.tsx`

```tsx
'use client';

import React, { useState } from 'react';

interface KnowledgeBaseConfig {
  useBedrockKnowledgeBase: boolean;
  bedrockKnowledgeBaseId: string;
  bedrockKnowledgeBaseRegion: string;
  bedrockKnowledgeBaseMaxResults: number;
}

const KnowledgeBaseSection: React.FC<{
  config: KnowledgeBaseConfig;
  onChange: (config: KnowledgeBaseConfig) => void;
}> = ({ config, onChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="knowledge-base-section">
      <h3>Data Source Configuration</h3>
      
      {/* Toggle Switch */}
      <div className="form-group">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={config.useBedrockKnowledgeBase}
            onChange={(e) => onChange({
              ...config,
              useBedrockKnowledgeBase: e.target.checked
            })}
          />
          <span>Use AWS Bedrock Knowledge Base</span>
        </label>
        <p className="help-text">
          Enable to use a Bedrock Knowledge Base instead of or in addition to uploaded documents
        </p>
      </div>

      {/* KB Configuration (shown when enabled) */}
      {config.useBedrockKnowledgeBase && (
        <div className="kb-config">
          {/* KB ID - Required */}
          <div className="form-group required">
            <label htmlFor="kb-id">Knowledge Base ID</label>
            <input
              id="kb-id"
              type="text"
              placeholder="e.g., ABCDEFGHIJ"
              value={config.bedrockKnowledgeBaseId}
              onChange={(e) => onChange({
                ...config,
                bedrockKnowledgeBaseId: e.target.value
              })}
              required={config.useBedrockKnowledgeBase}
            />
            <p className="help-text">
              Find this in AWS Console → Bedrock → Knowledge Bases
            </p>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            type="button"
            className="btn-link"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '▼' : '▶'} Advanced Settings
          </button>

          {showAdvanced && (
            <>
              {/* Region - Optional */}
              <div className="form-group">
                <label htmlFor="kb-region">AWS Region (Optional)</label>
                <select
                  id="kb-region"
                  value={config.bedrockKnowledgeBaseRegion}
                  onChange={(e) => onChange({
                    ...config,
                    bedrockKnowledgeBaseRegion: e.target.value
                  })}
                >
                  <option value="">Use deployment region</option>
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  {/* Add more regions as needed */}
                </select>
                <p className="help-text">
                  Leave blank to use your deployment region
                </p>
              </div>

              {/* Max Results - Optional */}
              <div className="form-group">
                <label htmlFor="kb-max-results">Max Results</label>
                <input
                  id="kb-max-results"
                  type="number"
                  min="1"
                  max="50"
                  value={config.bedrockKnowledgeBaseMaxResults}
                  onChange={(e) => onChange({
                    ...config,
                    bedrockKnowledgeBaseMaxResults: parseInt(e.target.value) || 10
                  })}
                />
                <p className="help-text">
                  Number of contexts to retrieve (1-50, default: 10)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Info Box */}
      {config.useBedrockKnowledgeBase && (
        <div className="info-box">
          <strong>ℹ️ Hybrid Mode:</strong> You can use both Bedrock Knowledge Base 
          and uploaded documents together. The assistant will use information from both sources.
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseSection;
```

### 2. Validation Logic

Add validation before submitting the form:

```typescript
interface ValidationError {
  field: string;
  message: string;
}

function validateKnowledgeBaseConfig(
  config: KnowledgeBaseConfig
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (config.useBedrockKnowledgeBase) {
    // KB ID is required when KB is enabled
    if (!config.bedrockKnowledgeBaseId || config.bedrockKnowledgeBaseId.trim() === '') {
      errors.push({
        field: 'bedrockKnowledgeBaseId',
        message: 'Knowledge Base ID is required when Bedrock KB is enabled'
      });
    }

    // Validate KB ID format (basic check)
    if (config.bedrockKnowledgeBaseId && 
        !/^[A-Z0-9]{10}$/.test(config.bedrockKnowledgeBaseId)) {
      errors.push({
        field: 'bedrockKnowledgeBaseId',
        message: 'Knowledge Base ID should be 10 uppercase alphanumeric characters'
      });
    }

    // Validate max results range
    if (config.bedrockKnowledgeBaseMaxResults < 1 || 
        config.bedrockKnowledgeBaseMaxResults > 50) {
      errors.push({
        field: 'bedrockKnowledgeBaseMaxResults',
        message: 'Max results must be between 1 and 50'
      });
    }
  }

  return errors;
}
```

### 3. Form State Management (Client Component)

**File**: `components/assistant/AssistantForm.tsx`

Example using React hooks with Next.js:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const AssistantForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: '',
    disclaimer: '',
    tags: [],
    dataSources: [],
    data: {
      useBedrockKnowledgeBase: false,
      bedrockKnowledgeBaseId: '',
      bedrockKnowledgeBaseRegion: '',
      bedrockKnowledgeBaseMaxResults: 10,
      // ... other data fields
    }
  });

  const [errors, setErrors] = useState<ValidationError[]>([]);

  const handleKBConfigChange = (kbConfig: KnowledgeBaseConfig) => {
    setFormData({
      ...formData,
      data: {
        ...formData.data,
        ...kbConfig
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validationErrors = validateKnowledgeBaseConfig(formData.data);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Clean up data before sending
    const payload = {
      data: {
        ...formData,
        data: formData.data.useBedrockKnowledgeBase 
          ? formData.data 
          : undefined // Don't send KB config if not enabled
      }
    };

    try {
      const response = await fetch('/api/assistant/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        // Handle success - redirect to assistant page
        router.push(`/assistants/${result.data.assistantId}`);
        router.refresh(); // Refresh server components
      } else {
        // Handle error
        setErrors([{ field: 'general', message: result.message }]);
      }
    } catch (error) {
      setErrors([{ field: 'general', message: 'Failed to create assistant' }]);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Existing form fields... */}
      
      <KnowledgeBaseSection
        config={formData.data}
        onChange={handleKBConfigChange}
      />

      {/* Error display */}
      {errors.length > 0 && (
        <div className="error-messages">
          {errors.map((error, idx) => (
            <div key={idx} className="error-message">
              {error.message}
            </div>
          ))}
        </div>
      )}

      <button type="submit">Create Assistant</button>
    </form>
  );
};
```

## Next.js API Route (Optional)

### 3b. API Route Handler

If you want to proxy requests through Next.js API routes:

**File**: `app/api/assistant/create/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get session/token
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    // Forward to backend
    const response = await fetch(`${process.env.BACKEND_API_URL}/assistant/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error creating assistant:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Server Actions (Alternative)

### 3c. Using Server Actions

For a more Next.js-native approach, use Server Actions:

**File**: `app/actions/assistant.ts`

```typescript
'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createAssistant(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { success: false, message: 'Unauthorized' };
  }

  // Parse form data
  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    instructions: formData.get('instructions') as string,
    disclaimer: formData.get('disclaimer') as string,
    tags: JSON.parse(formData.get('tags') as string),
    dataSources: JSON.parse(formData.get('dataSources') as string),
    data: {
      useBedrockKnowledgeBase: formData.get('useBedrockKnowledgeBase') === 'true',
      bedrockKnowledgeBaseId: formData.get('bedrockKnowledgeBaseId') as string,
      bedrockKnowledgeBaseRegion: formData.get('bedrockKnowledgeBaseRegion') as string,
      bedrockKnowledgeBaseMaxResults: parseInt(formData.get('bedrockKnowledgeBaseMaxResults') as string) || 10,
    }
  };

  try {
    const response = await fetch(`${process.env.BACKEND_API_URL}/assistant/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
      body: JSON.stringify({ data })
    });

    const result = await response.json();

    if (result.success) {
      // Revalidate the assistants list
      revalidatePath('/assistants');
    }

    return result;
  } catch (error) {
    console.error('Error creating assistant:', error);
    return { success: false, message: 'Failed to create assistant' };
  }
}
```

**Using the Server Action in your form:**

```tsx
'use client';

import { createAssistant } from '@/app/actions/assistant';
import { useFormState, useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Assistant'}
    </button>
  );
}

export default function AssistantForm() {
  const [state, formAction] = useFormState(createAssistant, null);

  return (
    <form action={formAction}>
      {/* Form fields */}
      <SubmitButton />
      {state?.message && (
        <div className={state.success ? 'success' : 'error'}>
          {state.message}
        </div>
      )}
    </form>
  );
}
```

## Display KB Information

### 4. Assistant List/Card View (Server Component)

Show KB status in assistant cards. This can be a Server Component:

**File**: `components/assistant/AssistantCard.tsx`

```tsx
import { Assistant } from '@/types/assistant';

export default function AssistantCard({ assistant }: { assistant: Assistant }) {
  const hasKB = assistant.data?.useBedrockKnowledgeBase;
  const hasDocuments = assistant.dataSources?.length > 0;

  return (
    <div className="assistant-card">
      <h3>{assistant.name}</h3>
      <p>{assistant.description}</p>
      
      {/* Data Source Badges */}
      <div className="data-source-badges">
        {hasKB && (
          <span className="badge badge-kb" title="Uses Bedrock Knowledge Base">
            🗄️ Knowledge Base
          </span>
        )}
        {hasDocuments && (
          <span className="badge badge-docs" title="Has uploaded documents">
            📄 Documents ({assistant.dataSources.length})
          </span>
        )}
        {hasKB && hasDocuments && (
          <span className="badge badge-hybrid" title="Hybrid mode">
            🔄 Hybrid
          </span>
        )}
      </div>

      {/* KB Details (expandable) */}
      {hasKB && (
        <details className="kb-details">
          <summary>Knowledge Base Details</summary>
          <dl>
            <dt>KB ID:</dt>
            <dd><code>{assistant.data.bedrockKnowledgeBaseId}</code></dd>
            
            {assistant.data.bedrockKnowledgeBaseRegion && (
              <>
                <dt>Region:</dt>
                <dd>{assistant.data.bedrockKnowledgeBaseRegion}</dd>
              </>
            )}
            
            <dt>Max Results:</dt>
            <dd>{assistant.data.bedrockKnowledgeBaseMaxResults || 10}</dd>
          </dl>
        </details>
      )}
    </div>
  );
}
```

### 4b. Assistant List Page (Server Component)

**File**: `app/assistants/page.tsx`

```tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AssistantCard from '@/components/assistant/AssistantCard';

async function getAssistants(accessToken: string) {
  const response = await fetch(`${process.env.BACKEND_API_URL}/assistant/list`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    cache: 'no-store' // or use revalidation
  });

  if (!response.ok) {
    throw new Error('Failed to fetch assistants');
  }

  return response.json();
}

export default async function AssistantsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.accessToken) {
    return <div>Please sign in</div>;
  }

  const result = await getAssistants(session.accessToken);

  if (!result.success) {
    return <div>Error loading assistants</div>;
  }

  return (
    <div className="assistants-grid">
      <h1>Your Assistants</h1>
      <div className="grid">
        {result.data.map((assistant) => (
          <AssistantCard key={assistant.id} assistant={assistant} />
        ))}
      </div>
    </div>
  );
}
```

## Styling with Tailwind CSS (Optional)

### 5a. Tailwind CSS Version

If you're using Tailwind CSS (common in Next.js):

**File**: `components/assistant/KnowledgeBaseSection.tsx`

```tsx
'use client';

import { useState } from 'react';

export default function KnowledgeBaseSection({ config, onChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-5 my-5 bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Data Source Configuration</h3>
      
      {/* Toggle Switch */}
      <label className="flex items-center gap-3 cursor-pointer mb-2">
        <input
          type="checkbox"
          checked={config.useBedrockKnowledgeBase}
          onChange={(e) => onChange({
            ...config,
            useBedrockKnowledgeBase: e.target.checked
          })}
          className="w-5 h-5 cursor-pointer"
        />
        <span className="font-medium">Use AWS Bedrock Knowledge Base</span>
      </label>
      <p className="text-sm text-gray-600 mb-4">
        Enable to use a Bedrock Knowledge Base instead of or in addition to uploaded documents
      </p>

      {/* KB Configuration */}
      {config.useBedrockKnowledgeBase && (
        <div className="mt-4 p-4 bg-white rounded border-l-4 border-green-500">
          {/* KB ID */}
          <div className="mb-4">
            <label htmlFor="kb-id" className="block mb-2 font-medium">
              Knowledge Base ID <span className="text-red-500">*</span>
            </label>
            <input
              id="kb-id"
              type="text"
              placeholder="e.g., ABCDEFGHIJ"
              value={config.bedrockKnowledgeBaseId}
              onChange={(e) => onChange({
                ...config,
                bedrockKnowledgeBaseId: e.target.value
              })}
              required={config.useBedrockKnowledgeBase}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Find this in AWS Console → Bedrock → Knowledge Bases
            </p>
          </div>

          {/* Advanced Settings */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 underline text-sm mb-2"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Settings
          </button>

          {showAdvanced && (
            <div className="space-y-4">
              {/* Region */}
              <div>
                <label htmlFor="kb-region" className="block mb-2 font-medium text-sm">
                  AWS Region (Optional)
                </label>
                <select
                  id="kb-region"
                  value={config.bedrockKnowledgeBaseRegion}
                  onChange={(e) => onChange({
                    ...config,
                    bedrockKnowledgeBaseRegion: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Use deployment region</option>
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to use your deployment region
                </p>
              </div>

              {/* Max Results */}
              <div>
                <label htmlFor="kb-max-results" className="block mb-2 font-medium text-sm">
                  Max Results
                </label>
                <input
                  id="kb-max-results"
                  type="number"
                  min="1"
                  max="50"
                  value={config.bedrockKnowledgeBaseMaxResults}
                  onChange={(e) => onChange({
                    ...config,
                    bedrockKnowledgeBaseMaxResults: parseInt(e.target.value) || 10
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of contexts to retrieve (1-50, default: 10)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      {config.useBedrockKnowledgeBase && (
        <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded text-sm">
          <strong>ℹ️ Hybrid Mode:</strong> You can use both Bedrock Knowledge Base 
          and uploaded documents together. The assistant will use information from both sources.
        </div>
      )}
    </div>
  );
}
```

### 5b. CSS Modules (Alternative)

If you prefer CSS Modules:

**File**: `components/assistant/KnowledgeBaseSection.module.css`

```css
/* Knowledge Base Section */
.knowledge-base-section {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  background: #f9f9f9;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 500;
}

.toggle-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.kb-config {
  margin-top: 20px;
  padding: 15px;
  background: white;
  border-radius: 4px;
  border-left: 4px solid #4CAF50;
}

.form-group {
  margin-bottom: 15px;
}

.form-group.required label::after {
  content: " *";
  color: red;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.help-text {
  margin-top: 5px;
  font-size: 12px;
  color: #666;
}

.info-box {
  margin-top: 15px;
  padding: 12px;
  background: #e3f2fd;
  border-left: 4px solid #2196F3;
  border-radius: 4px;
  font-size: 14px;
}

.btn-link {
  background: none;
  border: none;
  color: #2196F3;
  cursor: pointer;
  padding: 5px 0;
  font-size: 14px;
  text-decoration: underline;
}

.btn-link:hover {
  color: #1976D2;
}

/* Data Source Badges */
.data-source-badges {
  display: flex;
  gap: 8px;
  margin: 10px 0;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-kb {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #4caf50;
}

.badge-docs {
  background: #e3f2fd;
  color: #1565c0;
  border: 1px solid #2196f3;
}

.badge-hybrid {
  background: #fff3e0;
  color: #e65100;
  border: 1px solid #ff9800;
}

/* KB Details */
.kb-details {
  margin-top: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.kb-details summary {
  cursor: pointer;
  font-weight: 500;
  color: #2196F3;
}

.kb-details dl {
  margin-top: 10px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
}

.kb-details dt {
  font-weight: 500;
  color: #666;
}

.kb-details dd {
  margin: 0;
}

.kb-details code {
  background: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 12px;
}

/* Error Messages */
.error-messages {
  margin: 15px 0;
  padding: 12px;
  background: #ffebee;
  border-left: 4px solid #f44336;
  border-radius: 4px;
}

.error-message {
  color: #c62828;
  font-size: 14px;
  margin: 5px 0;
}
```

**Using CSS Modules:**

```tsx
import styles from './KnowledgeBaseSection.module.css';

export default function KnowledgeBaseSection({ config, onChange }) {
  return (
    <div className={styles.kbSection}>
      {/* Component content */}
    </div>
  );
}
```

## TypeScript Types

### 5c. Type Definitions

**File**: `types/assistant.ts`

```typescript
export interface KnowledgeBaseConfig {
  useBedrockKnowledgeBase: boolean;
  bedrockKnowledgeBaseId: string;
  bedrockKnowledgeBaseRegion: string;
  bedrockKnowledgeBaseMaxResults: number;
}

export interface AssistantData extends KnowledgeBaseConfig {
  // Other data fields
  dataSourceOptions?: object;
  messageOptions?: object;
  [key: string]: any;
}

export interface DataSource {
  id: string;
  name: string;
  type: string;
  key?: string;
  metadata?: Record<string, any>;
}

export interface Assistant {
  id: string;
  assistantId: string;
  version: number;
  name: string;
  description: string;
  instructions: string;
  disclaimer: string;
  tags: string[];
  user: string;
  createdAt: string;
  updatedAt: string;
  dataSources: DataSource[];
  data?: AssistantData;
}

export interface CreateAssistantRequest {
  data: {
    name: string;
    description: string;
    instructions: string;
    disclaimer: string;
    tags: string[];
    dataSources: DataSource[];
    assistantId?: string; // For updates
    data?: Partial<AssistantData>;
  };
}

export interface CreateAssistantResponse {
  success: boolean;
  message: string;
  data?: {
    assistantId: string;
    id: string;
    version: number;
    data_sources: DataSource[];
    ast_data: AssistantData;
  };
}
```

## Environment Variables

### 5d. Next.js Environment Setup

**File**: `.env.local`

```bash
# Backend API URL
BACKEND_API_URL=https://your-backend-api.com

# For client-side (must start with NEXT_PUBLIC_)
NEXT_PUBLIC_BACKEND_API_URL=https://your-backend-api.com

# NextAuth (if using)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

**File**: `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BACKEND_API_URL: process.env.BACKEND_API_URL,
  },
  // If you need to proxy API requests
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.BACKEND_API_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

## User Experience Considerations

### 6. Help Text and Tooltips

Add helpful information throughout:

```tsx
const KBHelpTooltip: React.FC = () => (
  <div className="tooltip">
    <span className="tooltip-icon">ℹ️</span>
    <div className="tooltip-content">
      <h4>What is a Bedrock Knowledge Base?</h4>
      <p>
        AWS Bedrock Knowledge Bases allow you to store and query large 
        document collections using semantic search. This is ideal for:
      </p>
      <ul>
        <li>Large document libraries (100s or 1000s of files)</li>
        <li>Frequently updated content</li>
        <li>Enterprise knowledge management</li>
      </ul>
      <p>
        <a href="https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html" 
           target="_blank" rel="noopener noreferrer">
          Learn more →
        </a>
      </p>
    </div>
  </div>
);
```

### 7. Loading States

Show loading state during KB validation:

```tsx
const [isValidatingKB, setIsValidatingKB] = useState(false);

const validateKBExists = async (kbId: string) => {
  setIsValidatingKB(true);
  try {
    // Optional: Add an endpoint to validate KB exists
    const response = await fetch(`/assistant/validate-kb?kbId=${kbId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const result = await response.json();
    return result.valid;
  } catch (error) {
    return false;
  } finally {
    setIsValidatingKB(false);
  }
};

// In the UI:
{isValidatingKB && (
  <span className="loading-indicator">
    ⏳ Validating Knowledge Base...
  </span>
)}
```

## Testing Checklist

### 8. Frontend Testing

- [ ] Toggle KB on/off works correctly
- [ ] KB ID field shows/hides based on toggle
- [ ] Required validation works for KB ID
- [ ] Advanced settings expand/collapse
- [ ] Region dropdown populates correctly
- [ ] Max results accepts valid range (1-50)
- [ ] Form submits with correct payload
- [ ] Error messages display properly
- [ ] KB badge shows in assistant list
- [ ] KB details expand/collapse works
- [ ] Hybrid mode badge shows when both KB and docs present
- [ ] Edit existing assistant loads KB config correctly
- [ ] Can disable KB on existing KB-enabled assistant

## API Integration Examples

### 9. Create Assistant with KB

```typescript
async function createAssistantWithKB(formData: AssistantFormData) {
  const payload = {
    data: {
      name: formData.name,
      description: formData.description,
      instructions: formData.instructions,
      disclaimer: formData.disclaimer,
      tags: formData.tags,
      dataSources: formData.dataSources,
      data: {
        useBedrockKnowledgeBase: true,
        bedrockKnowledgeBaseId: "ABCDEFGHIJ",
        bedrockKnowledgeBaseMaxResults: 10
        // Region omitted - will use deployment region
      }
    }
  };

  const response = await fetch('/assistant/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });

  return await response.json();
}
```

### 10. Update Existing Assistant

```typescript
async function updateAssistantKBConfig(
  assistantId: string,
  kbConfig: KnowledgeBaseConfig
) {
  const payload = {
    data: {
      assistantId: assistantId,
      // Include all required fields...
      data: {
        ...kbConfig
      }
    }
  };

  const response = await fetch('/assistant/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });

  return await response.json();
}
```

## Next.js-Specific Patterns

### 10b. Loading States with Suspense

```tsx
import { Suspense } from 'react';
import AssistantList from '@/components/assistant/AssistantList';

export default function AssistantsPage() {
  return (
    <div>
      <h1>Your Assistants</h1>
      <Suspense fallback={<AssistantListSkeleton />}>
        <AssistantList />
      </Suspense>
    </div>
  );
}

function AssistantListSkeleton() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse bg-gray-200 h-32 rounded" />
      ))}
    </div>
  );
}
```

### 10c. Error Boundaries

**File**: `app/assistants/error.tsx`

```tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded">
      <h2 className="text-lg font-semibold text-red-800">
        Something went wrong!
      </h2>
      <p className="text-red-600 mt-2">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
}
```

### 10d. Optimistic Updates

```tsx
'use client';

import { useOptimistic } from 'react';
import { updateAssistant } from '@/app/actions/assistant';

export default function AssistantToggle({ assistant }) {
  const [optimisticKB, setOptimisticKB] = useOptimistic(
    assistant.data?.useBedrockKnowledgeBase ?? false
  );

  async function handleToggle(enabled: boolean) {
    setOptimisticKB(enabled);
    await updateAssistant(assistant.id, {
      ...assistant,
      data: {
        ...assistant.data,
        useBedrockKnowledgeBase: enabled
      }
    });
  }

  return (
    <button
      onClick={() => handleToggle(!optimisticKB)}
      className={optimisticKB ? 'bg-green-500' : 'bg-gray-300'}
    >
      {optimisticKB ? 'KB Enabled' : 'KB Disabled'}
    </button>
  );
}
```

## Migration Guide for Existing Next.js UI

### 11. Step-by-Step Integration

1. **Add KB fields to your assistant form state**
   ```typescript
   // Add to existing state
   data: {
     ...existingDataFields,
     useBedrockKnowledgeBase: false,
     bedrockKnowledgeBaseId: '',
     bedrockKnowledgeBaseRegion: '',
     bedrockKnowledgeBaseMaxResults: 10
   }
   ```

2. **Add the KB section component to your form**
   ```tsx
   <KnowledgeBaseSection
     config={formData.data}
     onChange={handleKBConfigChange}
   />
   ```

3. **Add validation logic**
   ```typescript
   const errors = validateKnowledgeBaseConfig(formData.data);
   ```

4. **Update assistant list/cards to show KB status**
   ```tsx
   {assistant.data?.useBedrockKnowledgeBase && (
     <span className="badge badge-kb">🗄️ KB</span>
   )}
   ```

5. **Add API route or Server Action**
   ```typescript
   // app/api/assistant/create/route.ts
   export async function POST(request: NextRequest) {
     // Proxy to backend
   }
   ```

6. **Test thoroughly**
   - Create new KB assistant
   - Edit existing assistant to add KB
   - Disable KB on KB-enabled assistant
   - Use hybrid mode (KB + uploads)
   - Test with Server Components and Client Components
   - Verify revalidation works

## Troubleshooting

### Common Frontend Issues

**Issue**: KB ID validation fails
- Check regex pattern matches AWS KB ID format
- Verify KB exists in AWS Console

**Issue**: Form doesn't submit
- Check all required fields are filled
- Verify validation logic is correct
- Check browser console for errors

**Issue**: KB config doesn't save
- Verify payload structure matches backend expectations
- Check network tab for API errors
- Ensure `data` object is included in request

## Next.js Best Practices

### 12. Performance Optimization

```tsx
// Use dynamic imports for heavy components
import dynamic from 'next/dynamic';

const KnowledgeBaseSection = dynamic(
  () => import('@/components/assistant/KnowledgeBaseSection'),
  { ssr: false } // Only load on client if needed
);
```

### 13. Caching Strategy

```typescript
// Revalidate assistants list every 60 seconds
export const revalidate = 60;

// Or use on-demand revalidation
import { revalidatePath } from 'next/cache';

async function createAssistant(data) {
  // ... create assistant
  revalidatePath('/assistants');
}
```

### 14. Metadata for SEO

```typescript
// app/assistants/[id]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const assistant = await getAssistant(params.id);
  
  return {
    title: `${assistant.name} | Assistants`,
    description: assistant.description,
  };
}
```

## Additional Resources

- Backend API Documentation: `BEDROCK_KB_INTEGRATION.md`
- Troubleshooting Guide: `BEDROCK_KB_TROUBLESHOOTING.md`
- Example Configurations: `examples/` folder
- Next.js Documentation: https://nextjs.org/docs

---

**Need Help?**
- Check the backend integration docs
- Review Next.js-specific examples above
- Test with the provided example payloads
- Verify backend is deployed with KB support
- Check Next.js App Router documentation

**Version**: 1.0 (Next.js Edition)  
**Last Updated**: December 2024  
**Next.js Version**: 13+ (App Router)
