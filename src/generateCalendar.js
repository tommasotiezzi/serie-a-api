// src/generateCalendar.js - Generate ICAL calendar from Serie A first games
const fs = require('fs').promises;
const ical = require('ical-generator').default || require('ical-generator');
const path = require('path');

class SerieACalendarGenerator {
    constructor() {
        this.firstGames = [];
        this.calendar = null;
    }

    async loadFirstGames() {
        const dataPath = path.join('./data', 'first-games.json');
        
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            const parsed = JSON.parse(data);
            this.firstGames = parsed.games || [];
            
            console.log(`Loaded ${this.firstGames.length} first games`);
            return this.firstGames;
        } catch (error) {
            throw new Error(`Failed to load first games: ${error.message}`);
        }
    }

    generateCalendar() {
        if (!this.firstGames.length) {
            throw new Error('No first games loaded. Run loadFirstGames() first.');
        }

        this.calendar = ical({
            domain: 'tommasotiezzi.github.io',
            name: 'Serie A First Games 2025',
            description: 'First game of each Serie A matchday - 2025 season',
            timezone: 'Europe/Rome',
            ttl: 3600
        });

        this.firstGames.forEach(game => {
            const startTime = new Date(game.date);
            const endTime = new Date(startTime.getTime() + (105 * 60 * 1000)); // 105 minutes

            this.calendar.createEvent({
                start: startTime,
                end: endTime,
                summary: `${game.teams.home.name} vs ${game.teams.away.name}`,
                description: `Serie A ${game.league.round}\nVenue: ${game.venue.name}\n\nFirst game of the matchday`,
                location: `${game.venue.name}, Italy`,
                url: 'https://github.com/tommasotiezzi/serie-a-api'
            });
        });

        console.log(`Generated calendar with ${this.firstGames.length} events`);
        return this.calendar;
    }

    async saveCalendar() {
        if (!this.calendar) {
            throw new Error('No calendar generated. Run generateCalendar() first.');
        }

        const docsDir = './docs';
        await fs.mkdir(docsDir, { recursive: true });

        const calendarPath = path.join(docsDir, 'serie-a-first-games.ics');
        const calendarContent = this.calendar.toString();

        await fs.writeFile(calendarPath, calendarContent);
        
        console.log(`Calendar saved to ${calendarPath}`);
        return calendarPath;
    }

    async run() {
        try {
            await this.loadFirstGames();
            this.generateCalendar();
            await this.saveCalendar();
            
            console.log('\nCalendar generated successfully!');
            console.log('Will be available at: https://tommasotiezzi.github.io/serie-a-api/serie-a-first-games.ics');
            
        } catch (error) {
            console.error('Error generating calendar:', error.message);
            throw error;
        }
    }
}

if (require.main === module) {
    const generator = new SerieACalendarGenerator();
    generator.run().catch(console.error);
}

module.exports = SerieACalendarGenerator;

