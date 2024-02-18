/**
 * A script to summarize the incidents by month, consumable by heatmaps
 */





type ShortIncident = {
  id: string;
  date: number;
}




import { readFileSync, stat, statSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { GitHubIncident, getSavedIncidents } from './incident_scraper.mjs';

const savedIncidentsSummaryFilePath = resolve(join("data", "scripts", "incident_scraper", "incidents_summary.json"));


export function summarizeByMonths(): void {
  const incidents = getSavedIncidents();

  // shorten by start date
  const summarizedIncidents: ShortIncident[] = Object.values(incidents).map((i: GitHubIncident) => {
    const date = i.updates[i.updates.length - 1].unixtime;
    return {
      id: i.id,
      date
    }
  })

  setSavedIncidentsSummary(summarizedIncidents);
}



function setSavedIncidentsSummary(incidents: ShortIncident[]): void {
  writeFileSync(savedIncidentsSummaryFilePath, JSON.stringify(incidents, null, '  '));
}