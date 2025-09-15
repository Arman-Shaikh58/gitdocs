import asyncio
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

async def main():
    browser_config = BrowserConfig()
    crawler_config = CrawlerRunConfig(exclude_internal_links=True, 
                                      exclude_all_images=True,
                                      exclude_external_links=True,
                                      exclude_social_media_links=True)
    
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun("https://docs.crawl4ai.com/",
                                    config=crawler_config)
        print("Type : ",type(result))
        print("Length : ", len(result))
        print(result.markdown) 
       
if __name__ == "__main__":
    asyncio.run(main())