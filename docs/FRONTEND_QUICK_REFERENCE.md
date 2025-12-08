# Frontend Quick Reference - Bedrock KB Integration

## TL;DR

Add 4 new optional fields to your assistant form's `data` object:

```typescript
data: {
  useBedrockKnowledgeBase?: boolean;      // Toggle KB on/off
  bedrockKnowledgeBaseId?: string;        // KB ID (required if enabled)
  bedrockKnowledgeBaseRegion?: string;    // Optional: AWS region
  bedrockKnowledgeBaseMaxResults?: number; // Optional: 1-50, default 10
}
```

## Minimal UI Implementation

### 1. Add Toggle + KB ID Field

```tsx
<label>
  <input 
    type="checkbox" 
    checked={data.useBedrockKnowledgeBase}
    onChange={e => setData({...data, useBedrockKnowledgeBase: e.target.checked})}
  />
  Use Bedrock Knowledge Base
</label>

{data.useBedrockKnowledgeBase && (
  <input
    type="text"
    placeholder="Knowledge Base ID"
    value={data.bedrockKnowledgeBaseId}
    onChange={e => setData({...data, bedrockKnowledgeBaseId: e.target.value})}
    required
  />
)}
```

### 2. Validation

```typescript
if (data.useBedrockKnowledgeBase && !data.bedrockKnowledgeBaseId) {
  throw new Error('KB ID required when KB is enabled');
}
```

### 3. Display KB Status

```tsx
{assistant.data?.useBedrockKnowledgeBase && (
  <span className="badge">🗄️ Knowledge Base</span>
)}
```

## API Payload Example

```json
{
  "data": {
    "name": "My Assistant",
    "description": "...",
    "instructions": "...",
    "disclaimer": "...",
    "tags": [],
    "dataSources": [],
    "data": {
      "useBedrockKnowledgeBase": true,
      "bedrockKnowledgeBaseId": "ABCDEFGHIJ"
    }
  }
}
```

## Field Defaults

| Field | Default | Notes |
|-------|---------|-------|
| `useBedrockKnowledgeBase` | `false` | Must be explicitly enabled |
| `bedrockKnowledgeBaseId` | - | Required when enabled |
| `bedrockKnowledgeBaseRegion` | DEP_REGION env | Leave blank for auto |
| `bedrockKnowledgeBaseMaxResults` | `10` | Range: 1-50 |

## Common Patterns

### KB Only
```json
{
  "dataSources": [],
  "data": {
    "useBedrockKnowledgeBase": true,
    "bedrockKnowledgeBaseId": "KB123"
  }
}
```

### Hybrid (KB + Uploads)
```json
{
  "dataSources": [{"id": "file1"}, {"id": "file2"}],
  "data": {
    "useBedrockKnowledgeBase": true,
    "bedrockKnowledgeBaseId": "KB123"
  }
}
```

### Disable KB
```json
{
  "data": {
    "useBedrockKnowledgeBase": false
  }
}
```

## TypeScript Types

```typescript
interface AssistantData {
  // Existing fields...
  useBedrockKnowledgeBase?: boolean;
  bedrockKnowledgeBaseId?: string;
  bedrockKnowledgeBaseRegion?: string;
  bedrockKnowledgeBaseMaxResults?: number;
}

interface Assistant {
  id: string;
  assistantId: string;
  name: string;
  description: string;
  instructions: string;
  disclaimer: string;
  tags: string[];
  dataSources: DataSource[];
  data?: AssistantData;
}
```

## Visual Indicators

```tsx
// Badge for KB-enabled assistants
const KBBadge = () => (
  <span style={{
    background: '#e8f5e9',
    color: '#2e7d32',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px'
  }}>
    🗄️ Knowledge Base
  </span>
);

// Badge for hybrid mode
const HybridBadge = () => (
  <span style={{
    background: '#fff3e0',
    color: '#e65100',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px'
  }}>
    🔄 Hybrid
  </span>
);
```

## Error Handling

```typescript
try {
  const response = await createAssistant(formData);
  if (!response.success) {
    // Backend validation error
    showError(response.message);
  }
} catch (error) {
  // Network or other error
  showError('Failed to create assistant');
}
```

## Testing Checklist

- [ ] Can toggle KB on/off
- [ ] KB ID field appears when enabled
- [ ] Validation prevents empty KB ID
- [ ] Can create KB-only assistant
- [ ] Can create hybrid assistant
- [ ] KB badge shows in list
- [ ] Can edit existing assistant to add KB
- [ ] Can disable KB on existing assistant

## Need More Details?

See `FRONTEND_INTEGRATION_GUIDE.md` for:
- Complete React components
- Styling examples
- Advanced features
- Full validation logic
- UX best practices

---

**Quick Links:**
- 📖 Full Guide: `FRONTEND_INTEGRATION_GUIDE.md`
- 🔧 Backend Docs: `BEDROCK_KB_INTEGRATION.md`
- 🚀 Quick Start: `BEDROCK_KB_QUICKSTART.md`
