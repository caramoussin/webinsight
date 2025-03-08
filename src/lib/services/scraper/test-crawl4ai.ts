import { WebScrapingService } from './WebScrapingService';
import { pipe } from 'fp-ts/function';
import { fold } from 'fp-ts/Either';

/**
 * Test the Crawl4AI integration with WebScrapingService
 */
async function testCrawl4AIIntegration() {
  console.log('=== Testing Crawl4AI Integration ===');
  
  try {
    const result = await WebScrapingService.scrape({
      url: 'https://httpbin.org/html',
      contentType: 'html',
      timeout: 10000,
      useCrawl4AI: true,
      crawl4AIOptions: {
        filterType: 'pruning',
        threshold: 0.48,
        useCache: true,
        checkRobotsTxt: true,
        respectRateLimits: true
      }
    });

    // Use fp-ts to handle the Either result
    pipe(
      result,
      fold(
        // Error case
        (error) => {
          console.error('❌ Error scraping with Crawl4AI:');
          console.error(`Code: ${error.code}`);
          console.error(`Message: ${error.message}`);
          console.error('Details:', error.details);
        },
        // Success case
        (data) => {
          console.log('✅ Successfully scraped content with Crawl4AI!');
          console.log(`URL: ${data.url}`);
          console.log(`Content Type: ${data.contentType}`);
          
          if (data.markdown) {
            console.log(`Markdown content length: ${data.markdown.length}`);
            console.log('First 200 characters of markdown:');
            console.log(data.markdown.substring(0, 200));
          }
          
          if (data.extractedLinks && data.extractedLinks.length > 0) {
            console.log(`Extracted ${data.extractedLinks.length} links`);
          }
          
          if (data.metadata) {
            console.log('Metadata:');
            console.log(data.metadata);
          }
        }
      )
    );
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testCrawl4AIIntegration().catch(console.error);
