// src/footballDataFetcher.js - Fetch Serie A from football-data.org
const https = require('https');
const fs = require('fs').promises;

async function fetchSerieAData() {
    console.log('Fetching Serie A 2025 from football-data.org...');
    
    const options = {
        method: 'GET',
        hostname: 'api.football-data.org',
        port: null,
        path: '/v4/competitions/2019/matches',
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
                    const data = JSON.parse(body);
                    resolve(data.matches || []);
                } catch (error) {
                    reject(error);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function getFirstGamePerRound(matches) {
    const rounds = {};
    
    // Group by matchday
    matches.forEach(match => {
        const round = match.matchday;
        if (!rounds[round]) {
            rounds[round] = [];
        }
        rounds[round].push(match);
    });
    
    // Get first game from each round by Rome time
    const firstGames = [];
    Object.keys(rounds).forEach(round => {
        const roundMatches = rounds[round];
        
        // Sort by Rome time
        roundMatches.sort((a, b) => {
            const dateA = new Date(a.utcDate);
            const dateB = new Date(b.utcDate);
            const romeA = new Date(dateA.toLocaleString("en-US", {timeZone: "Europe/Rome"}));
            const romeB = new Date(dateB.toLocaleString("en-US", {timeZone: "Europe/Rome"}));
            return romeA - romeB;
        });
        
        firstGames.push(roundMatches[0]);
    });
    
    return firstGames;
}

function normalizeMatch(match) {
    // Convert UTC to Rome time (UTC+1 or UTC+2 during DST)
    const utcDate = new Date(match.utcDate);
    const romeDate = new Date(utcDate.toLocaleString("en-US", {timeZone: "Europe/Rome"}));
    
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
            round: `Regular Season - ${match.matchday}`
        },
        fixture: {
            date: romeDate.toISOString(),
            status: {
                long: match.status
            }
        }
    };
}

async function saveData(allMatches, firstGames) {
    await fs.mkdir('./data', { recursive: true });
    
    const normalizedAll = allMatches.map(normalizeMatch);
    const normalizedFirst = firstGames.map(normalizeMatch);
    
    const allData = {
        source: 'football-data.org',
        season: '2025',
        lastUpdated: new Date().toISOString(),
        totalFixtures: normalizedAll.length,
        fixtures: normalizedAll
    };

    const firstData = {
        source: 'football-data.org',
        season: '2025',
        lastUpdated: new Date().toISOString(),
        totalGames: normalizedFirst.length,
        games: normalizedFirst
    };

    await fs.writeFile('./data/all-fixtures.json', JSON.stringify(allData, null, 2));
    await fs.writeFile('./data/first-games.json', JSON.stringify(firstData, null, 2));
    
    console.log(`Saved ${normalizedAll.length} total fixtures`);
    console.log(`Saved ${normalizedFirst.length} first games`);
}

async function main() {
    try {
        const matches = await fetchSerieAData();
        console.log(`Fetched ${matches.length} matches`);
        
        const firstGames = getFirstGamePerRound(matches);
        console.log(`Found ${firstGames.length} first games`);
        
        await saveData(matches, firstGames);
        console.log('Done!');
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { fetchSerieAData, getFirstGamePerRound, normalizeMatch };