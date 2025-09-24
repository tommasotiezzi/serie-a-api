// test-api.js - Test API-Football connection
const https = require('https');

// Your API key from RapidAPI
const API_KEY = '575c786031msh87bb93d27fbac65p130cb2jsne43a28f7d960';

// Test API connection with Serie A fixtures
function testAPI() {
    const options = {
        method: 'GET',
        hostname: 'api-football-v1.p.rapidapi.com',
        port: null,
        path: '/v3/fixtures?league=135&season=2025',
        headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
        }
    };

    console.log('🔌 Testing API-Football connection...');
    console.log('📊 Fetching Serie A 2025 fixtures...\n');

    const req = https.request(options, function (res) {
        const chunks = [];

        res.on('data', function (chunk) {
            chunks.push(chunk);
        });

        res.on('end', function () {
            const body = Buffer.concat(chunks);
            const data = JSON.parse(body.toString());

            if (data.errors && data.errors.length > 0) {
                console.error('❌ API Error:', data.errors);
                return;
            }

            console.log('✅ API Connection successful!');
            console.log(`📈 Status: ${res.statusCode}`);
            console.log(`🎯 Total fixtures found: ${data.response?.length || 0}`);
            
            if (data.response && data.response.length > 0) {
                const fixture = data.response[0];
                console.log('\n📋 Sample fixture:');
                console.log(`   ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
                console.log(`   Date: ${fixture.fixture.date}`);
                console.log(`   Venue: ${fixture.fixture.venue.name}`);
                console.log(`   Status: ${fixture.fixture.status.long}`);
            }

            console.log('\n🎉 Ready to build the Serie A API!');
        });
    });

    req.on('error', function (e) {
        console.error('❌ Request failed:', e.message);
    });

    req.end();
}

// Run the test
testAPI();