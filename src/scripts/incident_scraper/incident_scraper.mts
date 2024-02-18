import * as cheerio from 'cheerio';
import { readFileSync, stat, statSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { getSavedIncidentIDs } from './incident_id_scraper.mjs';


// A minimal type to describe the data in incidents.json
export type GitHubIncident = {
  id: string;
  name: string;
  updates: {
    title: string;
    text: string;
    time: string;
    unixtime: number
  }[];
};

// We don't care what the incidents actually look like, just that this is how it is stored in the JSON
type IncidentMap = Record<string, GitHubIncident>;

const savedIncidentsFilePath = resolve(join("data", "scripts", "incident_scraper", "incidents.json"));
const savedIncidentsCacheFilePath = resolve(join("data", "scripts", "incident_scraper", "cache"));




/**
 * Scrape all the incidents that we haven't grabbed yet
 * @param crawlingDelayInMs 
 * @returns 
 */
export async function scrapeNewIncidents(crawlingDelayInMs: number): Promise<void> {
  const savedIncidentIds = getSavedIncidentIDs();
  const savedIncidents = getSavedIncidents();

  const remaining = savedIncidentIds.filter(id => !savedIncidents[id]);
  console.log("Missing", remaining.length, "incidents");

  for (let i = 0; i < remaining.length; i++) {
    let id = remaining[i]
    console.log("Scraping incident", id, `  (${i}/${remaining.length}  ${Math.floor(i / remaining.length * 100)}%)`);
    let extracted = await extractIncidentInfoFromIncidentPage(id);
    savedIncidents[id] = extracted;

    // save progress every few
    if (i % 5 == 0) {
      setSavedIncidents(savedIncidents);
    }

    await sleep(crawlingDelayInMs);
  }

  setSavedIncidents(savedIncidents);
}


export function getSavedIncidents(): IncidentMap {
  const data = readFileSync(savedIncidentsFilePath, 'utf-8');
  return JSON.parse(data);
}
function setSavedIncidents(incidents: IncidentMap): void {
  writeFileSync(savedIncidentsFilePath, JSON.stringify(incidents, null, '  '));
}


async function extractIncidentInfoFromIncidentPage(incidentId: string): Promise<any> {
  const pageText = await getIncidentPage(incidentId);
  let $ = cheerio.load(pageText);

  let incidentName = $('.page-title .incident-name').text().trim();

  let updates: any[] = [];
  $('.incident-updates-container').children()
    .filter((i, el) => {
      return $(el).attr().class == "row update-row";
    })
    .map((i, child) => {
      const title = $(child).children('.update-title').text().trim();
      const text = $(child).children('.update-container').children('.update-body').text().trim()
      const time = $(child).children('.update-container').children('.update-timestamp').text().trim()
      const unixtime = parseInt($(child).children('.update-container').children('.update-timestamp').children('.ago').attr('data-datetime-unix') as any);
      updates.push({ title, text, time, unixtime })
    })

  let report = {
    id: incidentId,
    name: incidentName,
    //affected_services: impactedServices,
    updates
  }
  return report;
}

async function getIncidentPage(incidentId: string): Promise<string> {
  // TODO: cache this page
  const cacheKey = join(savedIncidentsCacheFilePath, incidentId + ".html");
  const inCache = statSync(cacheKey, { throwIfNoEntry: false });

  let pageText;

  if (!inCache) {
    const statusPageBaseURL = "https://www.githubstatus.com/incidents/";

    const response = await fetch(statusPageBaseURL + incidentId);
    const data = await response.text();

    let $ = cheerio.load(data);
    let incidentPortion = $('.status-incident .container').html();
    pageText = incidentPortion || "";
    writeFileSync(cacheKey, pageText);
  } else
    pageText = readFileSync(cacheKey, 'utf-8');

  return pageText;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}