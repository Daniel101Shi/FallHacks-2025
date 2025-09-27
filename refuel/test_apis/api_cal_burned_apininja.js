import 'dotenv/config';

const activity = process.argv[2];
const url = `https://api.api-ninjas.com/v1/caloriesburned?activity=${encodeURIComponent(activity)}&weight=160&duration=30`;

const apiKey = process.env.API_NINJAS_KEY 
if (!apiKey) {
  console.error("Missing API_NINJAS_KEY environment variable. Set it and try again.");
  process.exit(1);
}

const response = await fetch(url, {
  headers: { "X-Api-Key": apiKey },
});

if (!response.ok) {
  const body = await response.text();
  console.error(`HTTP ${response.status} ${response.statusText}\n${body}`);
  process.exit(1);
}

const data = await response.json();

console.log(data);