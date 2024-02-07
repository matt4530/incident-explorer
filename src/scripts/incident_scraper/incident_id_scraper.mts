import { readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';

const savedIdsFilePath = resolve(join("data", "scripts", "incident_scraper", "incident_ids.json"));




/**
 * Scrape until we have seen several duplicates or we have encountered several empty pages
 * @param crawlingDelayInMs 
 * @returns 
 */
export async function scrapeNewIds(crawlingDelayInMs: number): Promise<void> {
  const seenIDs = new Set(getSavedIncidentIDs());

  // if we haven't seen anything, just crawl all the pages
  if (seenIDs.size == 0) {
    return crawlEveryHistoryPage(crawlingDelayInMs);
  }

  let page = 1;
  let emptyPageCount = 0;
  let seenIDsCount = 0;

  // empty page stop criteria
  const emptyPageCountToStopAt = 4;
  // seen duplicates stop criteria
  const seenIdsCountToStopAt = 20;

  while (emptyPageCount < emptyPageCountToStopAt && seenIDsCount < seenIdsCountToStopAt) {
    console.log("Scraping page", page);
    const ids = await getIncidentIDsOnHistoryPage(page);

    // empty page, add to our other stop condition
    if (ids.length == 0)
      emptyPageCount++;
    // add all the IDs
    else
      ids.forEach(id => {
        if (seenIDs.has(id))
          seenIDsCount++;
        seenIDs.add(id)
      });

    await sleep(crawlingDelayInMs + Math.random() * crawlingDelayInMs / 10);

    setSavedIncidentIDs(Array.from(seenIDs));

    page++;
  }
  setSavedIncidentIDs(Array.from(seenIDs));
  console.log("Finished Scraping");
}




/**
 * Scrape until we have encountered several empty pages
 * @param crawlingDelayInMs 
 */
export async function crawlEveryHistoryPage(crawlingDelayInMs: number): Promise<void> {
  const seenIDs = new Set(getSavedIncidentIDs());

  let page = 1;

  let emptyPageCount = 0;
  const emptyPageCountToStopAt = 4;

  while (emptyPageCount < emptyPageCountToStopAt) {
    console.log("Scraping page", page);
    const ids = await getIncidentIDsOnHistoryPage(page);

    // empty page, add to our other stop condition
    if (ids.length == 0)
      emptyPageCount++;
    // add all the IDs
    else
      ids.forEach(id => seenIDs.add(id));

    sleep(crawlingDelayInMs + Math.random() * crawlingDelayInMs / 10);

    setSavedIncidentIDs(Array.from(seenIDs));

    page++;
  }
  setSavedIncidentIDs(Array.from(seenIDs));
  console.log("Finished Scraping");
}

export function getSavedIncidentIDs(): string[] {
  const data = readFileSync(savedIdsFilePath, 'utf-8');
  return JSON.parse(data);
}
function setSavedIncidentIDs(ids: string[]): void {
  writeFileSync(savedIdsFilePath, JSON.stringify(ids, null, '  '));
}

async function getIncidentIDsOnHistoryPage(pageNumber: number): Promise<string[]> {
  const incidentIdRegex = /\{&quot;code&quot;:&quot;([a-z0-9_]{12})&quot;/g

  const pageText = await getHistoryPage(pageNumber);
  const results: string[] = [];

  // search the whole page, don't bother trimming tokens down since you just create a dependency on the page structure which might change
  const matches = pageText.matchAll(incidentIdRegex);
  for (const match of matches) {
    results.push(match[1]);
  }
  return results;
}

async function getHistoryPage(pageNumber: number): Promise<string> {
  const statusPageBaseURL = "https://www.githubstatus.com/history?page=";


  const response = await fetch(statusPageBaseURL + pageNumber);
  const data = await response.text();
  return data;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}