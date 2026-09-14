// src/championsFetcher.js - Fetch Champions League from football-data.org
require('dotenv').config();
const https = require('https');
const fs = require('fs').promises;

async function fetchChampionsData() {
    console.log('Fetching Champions League from football-data.org...');

    const options = {
        method: 'GET',
        hostname: 'api.football-data.org',
        port: null,
        path: '/v4/competitions/2001/matches',
        headers: {
            'X-Auth-Token': process.env.FOOTBALL_DATA_TOKEN
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString();

                    // senza questo controllo un 401/429 salverebbe un file vuoto in silenzio
                    if (res.statusCode !== 200) {
                        return reject(new Error(`API ${res.statusCode}: ${body.slice(0, 200)}`));
                    }

                    const data = JSON.parse(body);

                    if (!Array.isArray(data.matches) || data.matches.length === 0) {
                        return reject(new Error('Nessun match ricevuto dalla Champions League'));
                    }

                    resolve(data.matches);
                } catch (error) {
                    reject(error);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function normalizeMatch(match) {
    // stesso trattamento data del fetcher Serie A, per coerenza tra i due JSON
    const utcDate = new Date(match.utcDate);
    const romeDate = new Date(utcDate.toLocaleString("en-US", { timeZone: "Europe/Rome" }));

    // in Champions matchday e' null dalle fasi a eliminazione: si ripiega su group/stage
    const round = match.matchday
        ? `League Phase - ${match.matchday}`
        : (match.group || match.stage || 'Knockout');

    return {
        id: match.id,
        date: romeDate.toISOString(),
        teams: {
            home: {
                name: match.homeTeam.name
            },
            away: {
                name: match.awayTeam.name
            }
        },
        venue: {
            name: match.venue || 'TBD',
            city: ''
        },
        league: {
            round: round
        },
        fixture: {
            date: romeDate.toISOString(),
            status: {
                long: match.status
            }
        }
    };
}

async function saveData(allMatches) {
    await fs.mkdir('./data', { recursive: true });

    const normalized = allMatches.map(normalizeMatch);

    const allData = {
        source: 'football-data.org',
        competition: 'UEFA Champions League',
        season: '2025',
        lastUpdated: new Date().toISOString(),
        totalFixtures: normalized.length,
        fixtures: normalized
    };

    await fs.writeFile('./data/cl-fixtures.json', JSON.stringify(allData, null, 2));

    console.log(`Saved ${normalized.length} Champions League fixtures`);
}

async function main() {
    try {
        const matches = await fetchChampionsData();
        console.log(`Fetched ${matches.length} matches`);

        await saveData(matches);
        console.log('Done!');

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { fetchChampionsData, normalizeMatch };
