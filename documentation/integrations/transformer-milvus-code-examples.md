# WebInsight - Transformer & Milvus Lite Code Examples

This document provides practical code examples for working with transformers via @effect/ai and Milvus Lite in the WebInsight application.

## Transformer Operations with @effect/ai

### Setting Up Transformer Models

```typescript
import { Effect } from "effect";
import { AI } from "@effect/ai";
import { TransformerModel } from "@effect/ai/TransformerModel";

// Define the transformer model configuration
const embeddingModelConfig = {
  modelId: "sentence-transformers/all-MiniLM-L6-v2",
  dimensions: 384,
  provider: "ollama" as const
};

// Create a transformer model instance
const embeddingModel = TransformerModel.make(embeddingModelConfig);

// Register the model with the AI registry
const registerModel = Effect.gen(function*(_) {
  const registry = yield* AI.Registry;
  yield* registry.register("embedding", embeddingModel);
});

// Run the effect to register the model
Effect.runPromise(registerModel);
```

### Generating Embeddings for Content

```typescript
import { Effect } from "effect";
import { AI } from "@effect/ai";
import { Article } from "$lib/types";

// Function to generate embeddings for an article
export const generateEmbedding = (article: Article) => Effect.gen(function*(_) {
  // Prepare the text for embedding (combine title and content)
  const textToEmbed = `${article.title}\n\n${article.content}`;
  
  // Get the embedding model from the registry
  const registry = yield* AI.Registry;
  const embeddingModel = yield* registry.get("embedding");
  
  // Generate the embedding
  const embedding = yield* embeddingModel.embed(textToEmbed);
  
  // Return the embedding with article ID for storage
  return {
    articleId: article.id,
    embedding: embedding.vector,
    dimensions: embedding.dimensions,
    timestamp: new Date().toISOString()
  };
});

// Example usage
const storeArticleEmbedding = (article: Article) => Effect.gen(function*(_) {
  const embeddingData = yield* generateEmbedding(article);
  
  // Store in Milvus Lite (implementation in the next section)
  yield* MilvusService.storeEmbedding(embeddingData);
  
  // Update article record in SQLite
  yield* DatabaseService.updateArticleEmbeddingId(article.id, embeddingData.id);
  
  return embeddingData;
});
```

### Using Transformers for Text Processing

```typescript
import { Effect } from "effect";
import { AI } from "@effect/ai";
import { TransformerModel } from "@effect/ai/TransformerModel";
import { Article } from "$lib/types";

// Define a sentiment analysis model
const sentimentModel = TransformerModel.make({
  modelId: "distilbert-base-uncased-finetuned-sst-2-english",
  provider: "ollama" as const
});

// Register the model
const registerSentimentModel = Effect.gen(function*(_) {
  const registry = yield* AI.Registry;
  yield* registry.register("sentiment", sentimentModel);
});

// Function to analyze sentiment
export const analyzeSentiment = (text: string) => Effect.gen(function*(_) {
  const registry = yield* AI.Registry;
  const model = yield* registry.get("sentiment");
  
  // Get sentiment classification
  const result = yield* model.classify(text, ["positive", "negative", "neutral"]);
  
  return {
    sentiment: result.label,
    confidence: result.score
  };
});

// Example usage for article sentiment analysis
const analyzeArticleSentiment = (article: Article) => Effect.gen(function*(_) {
  const sentiment = yield* analyzeSentiment(article.content);
  
  // Store sentiment analysis result
  yield* DatabaseService.updateArticleMetadata(article.id, {
    sentiment: sentiment.sentiment,
    sentimentConfidence: sentiment.confidence
  });
  
  return sentiment;
});
```

## Milvus Lite Integration

### Setting Up Milvus Lite

```typescript
import { Effect } from "effect";
import { MilvusClient } from "@zilliz/milvus-lite";
import { Schema, DataType } from "@zilliz/milvus-lite";

// Define the Milvus Lite service
export class MilvusService {
  private static client: MilvusClient;
  private static readonly COLLECTION_NAME = "article_embeddings";
  
  // Initialize Milvus Lite
  static initialize = Effect.gen(function*(_) {
    // Create client with local storage path
    const storagePath = "./data/milvus";
    MilvusService.client = new MilvusClient({ storagePath });
    
    // Check if collection exists
    const hasCollection = yield* Effect.tryPromise({
      try: () => MilvusService.client.hasCollection({
        collection_name: MilvusService.COLLECTION_NAME
      }),
      catch: (error) => new Error(`Failed to check collection: ${error.message}`)
    });
    
    // Create collection if it doesn't exist
    if (!hasCollection) {
      yield* MilvusService.createCollection();
    }
    
    return MilvusService.client;
  });
  
  // Create the embeddings collection
  private static createCollection = Effect.gen(function*(_) {
    const schema: Schema = {
      name: MilvusService.COLLECTION_NAME,
      fields: [
        {
          name: "id",
          data_type: DataType.VarChar,
          is_primary_key: true,
          max_length: 36
        },
        {
          name: "article_id",
          data_type: DataType.VarChar,
          max_length: 36
        },
        {
          name: "embedding",
          data_type: DataType.FloatVector,
          dim: 384
        },
        {
          name: "timestamp",
          data_type: DataType.VarChar,
          max_length: 30
        }
      ],
      enable_dynamic_field: true
    };
    
    // Create the collection
    yield* Effect.tryPromise({
      try: () => MilvusService.client.createCollection(schema),
      catch: (error) => new Error(`Failed to create collection: ${error.message}`)
    });
    
    // Create index for vector search
    yield* Effect.tryPromise({
      try: () => MilvusService.client.createIndex({
        collection_name: MilvusService.COLLECTION_NAME,
        field_name: "embedding",
        index_type: "HNSW",
        metric_type: "COSINE",
        params: { M: 8, efConstruction: 64 }
      }),
      catch: (error) => new Error(`Failed to create index: ${error.message}`)
    });
    
    // Load collection to memory for search
    yield* Effect.tryPromise({
      try: () => MilvusService.client.loadCollection({
        collection_name: MilvusService.COLLECTION_NAME
      }),
      catch: (error) => new Error(`Failed to load collection: ${error.message}`)
    });
    
    return true;
  });
  
  // Store an embedding
  static storeEmbedding = (data: {
    articleId: string;
    embedding: number[];
    dimensions: number;
    timestamp: string;
  }) => Effect.gen(function*(_) {
    const id = crypto.randomUUID();
    
    yield* Effect.tryPromise({
      try: () => MilvusService.client.insert({
        collection_name: MilvusService.COLLECTION_NAME,
        data: [{
          id,
          article_id: data.articleId,
          embedding: data.embedding,
          timestamp: data.timestamp
        }]
      }),
      catch: (error) => new Error(`Failed to insert embedding: ${error.message}`)
    });
    
    return id;
  });
  
  // Search for similar articles
  static findSimilarArticles = (embedding: number[], limit: number = 5, threshold: number = 0.7) => 
    Effect.gen(function*(_) {
      const searchResult = yield* Effect.tryPromise({
        try: () => MilvusService.client.search({
          collection_name: MilvusService.COLLECTION_NAME,
          data: [embedding],
          filter: "",
          limit,
          output_fields: ["article_id"],
          search_params: {
            metric_type: "COSINE",
            params: { ef: 64 }
          }
        }),
        catch: (error) => new Error(`Failed to search: ${error.message}`)
      });
      
      // Filter results by similarity threshold and extract article IDs
      const results = searchResult.results
        .filter(result => result.score >= threshold)
        .map(result => ({
          articleId: result.entity.article_id as string,
          similarity: result.score
        }));
      
      return results;
    });
}
```

### Using Milvus Lite for Semantic Search

```typescript
import { Effect } from "effect";
import { MilvusService } from "$lib/services/milvus";
import { ArticleService } from "$lib/services/article";
import { generateEmbedding } from "$lib/services/embedding";

// Function to find semantically similar articles
export const findSimilarArticles = (articleId: string, limit: number = 5) => 
  Effect.gen(function*(_) {
    // Get the article
    const article = yield* ArticleService.getArticleById(articleId);
    
    if (!article) {
      return Effect.fail(new Error(`Article with ID ${articleId} not found`));
    }
    
    // Generate embedding for the article if it doesn't exist
    let embeddingId = article.embeddingId;
    
    if (!embeddingId) {
      const embeddingData = yield* generateEmbedding(article);
      embeddingId = yield* MilvusService.storeEmbedding(embeddingData);
      
      // Update article with embedding ID
      yield* ArticleService.updateArticleEmbeddingId(articleId, embeddingId);
    }
    
    // Get the embedding vector
    const embeddingVector = yield* MilvusService.getEmbeddingById(embeddingId);
    
    // Find similar articles
    const similarArticles = yield* MilvusService.findSimilarArticles(
      embeddingVector,
      limit,
      0.75 // Similarity threshold
    );
    
    // Get full article data for the similar articles
    const articleDetails = yield* Effect.forEach(
      similarArticles,
      (similar) => ArticleService.getArticleById(similar.articleId)
    );
    
    // Combine similarity scores with article details
    return articleDetails
      .filter(Boolean)
      .map((article, index) => ({
        ...article,
        similarity: similarArticles[index].similarity
      }))
      .sort((a, b) => b.similarity - a.similarity);
  });

// Example usage in a Svelte component
// <script>
//   import { findSimilarArticles } from '$lib/services/recommendation';
//   import { Effect } from 'effect';
//   
//   export let articleId;
//   let similarArticles = [];
//   
//   $: {
//     if (articleId) {
//       Effect.runPromise(findSimilarArticles(articleId, 3))
//         .then(results => {
//           similarArticles = results;
//         })
//         .catch(error => {
//           console.error('Failed to find similar articles:', error);
//         });
//     }
//   }
// </script>
```

## Python Examples for Milvus Lite Setup

For those who prefer to use Python for data science tasks or testing, here's how to set up and use Milvus Lite with Python:

```python
import numpy as np
from pymilvus import MilvusClient
from sentence_transformers import SentenceTransformer

# Initialize Milvus Lite client
client = MilvusClient(uri="lite://./data/milvus")

# Create collection if it doesn't exist
if not client.has_collection("article_embeddings"):
    client.create_collection(
        collection_name="article_embeddings",
        dimension=384,
        primary_field="id",
        id_type="VARCHAR",
        vector_field="embedding"
    )
    
    # Create index for vector search
    client.create_index(
        collection_name="article_embeddings",
        field_name="embedding",
        index_type="HNSW",
        metric_type="COSINE",
        params={"M": 8, "efConstruction": 64}
    )
    
    # Load collection for search
    client.load_collection("article_embeddings")

# Initialize the transformer model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Function to generate and store embeddings
def store_article_embedding(article_id, title, content):
    # Generate embedding
    text = f"{title}\n\n{content}"
    embedding = model.encode(text).tolist()
    
    # Insert into Milvus
    client.insert(
        collection_name="article_embeddings",
        data=[{
            "id": article_id,
            "article_id": article_id,
            "embedding": embedding,
            "timestamp": datetime.now().isoformat()
        }]
    )
    
    return article_id

# Function to search for similar articles
def find_similar_articles(article_id, limit=5, threshold=0.7):
    # Get the article embedding
    results = client.query(
        collection_name="article_embeddings",
        filter=f"article_id == '{article_id}'",
        output_fields=["embedding"]
    )
    
    if not results:
        raise ValueError(f"No embedding found for article {article_id}")
    
    embedding = results[0]["embedding"]
    
    # Search for similar articles
    search_results = client.search(
        collection_name="article_embeddings",
        data=[embedding],
        limit=limit,
        output_fields=["article_id"],
        search_params={"metric_type": "COSINE", "params": {"ef": 64}}
    )
    
    # Filter by threshold and format results
    similar_articles = [
        {"article_id": hit["entity"]["article_id"], "similarity": hit["score"]}
        for hit in search_results[0]
        if hit["score"] >= threshold
    ]
    
    return similar_articles
```

## Performance Considerations

When working with transformers and vector databases, consider these performance optimizations:

1. **Batch Processing**: Generate embeddings in batches rather than one at a time.
2. **Caching**: Cache frequently used embeddings to avoid regeneration.
3. **Indexing**: Use HNSW indexing in Milvus Lite for optimal performance.
4. **Quantization**: Consider using quantized models for faster inference.
5. **Async Processing**: Generate embeddings asynchronously to avoid blocking the UI.

## Privacy Considerations

To maintain WebInsight's privacy-first principles:

1. **Local Models**: Use Ollama to run transformer models locally.
2. **Data Isolation**: Keep all vector data in the local Milvus Lite database.
3. **Encryption**: Apply the same encryption to vector data as to other profile data.
4. **Transparency**: Clearly document what data is being vectorized and stored.
5. **User Control**: Allow users to delete their vector data along with content.
