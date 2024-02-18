import { scrapeNewIds } from "./incident_id_scraper.mjs";
import { scrapeNewIncidents } from "./incident_scraper.mjs";
import { summarizeByMonths } from "./incidents_summary.mjs";

//await scrapeNewIds(400);
//await scrapeNewIncidents(400);
await summarizeByMonths();