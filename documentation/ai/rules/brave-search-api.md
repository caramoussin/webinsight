---
trigger: model_decision
description: When Brave Search is mentionned.
globs:
---

## Optional Brave Search Integration

### Overview

The app optionally integrates with Brave Search API to enhance AI agent capabilities while maintaining the local-first philosophy:

- 🔍 Privacy-respecting web search integration
- 🤖 AI-optimized content enrichment
- 📊 Schema-enriched metadata
- 🌐 Real-time web context
- ⚡ 2,000 free monthly queries

### Integration Levels

1. **Basic (Free Tier - 2,000 queries/month)**

   - Strategic query allocation across agents
   - Local caching for frequently accessed data
   - Automatic fallback to local-only operation

2. **Premium (Optional paid plans)**
   - Enhanced AI inference capabilities
   - Data storage rights for training
   - Higher query limits
   - Additional features like news and video search

### Smart Query Management

- Query budgeting system
- Cache-first approach
- Intelligent request batching
- Automatic fallback to local processing

### Brave Search Integration Architecture

```mermaid
graph TB
    subgraph BraveSearch["Brave Search Layer"]
        API[API Client]
        Cache[Local Cache]
        Budget[Query Budget]
    end

    subgraph Agents["AI Agents"]
        A[Archivist]
        S[Scribe]
        L[Librarian]
    end

    subgraph FallbackSystem["Fallback System"]
        Local[Local Processing]
        Hybrid[Hybrid Mode]
    end

    API --> Cache
    Cache --> A
    Cache --> S
    Cache --> L
    Budget --> API
    A --> Local
    S --> Local
    L --> Local
    Local --> Hybrid
```

#### Data Flow

1. Query request from agent
2. Check cache
3. Check budget
4. Make API call if needed
5. Cache response
6. Process results
7. Fallback if necessary
