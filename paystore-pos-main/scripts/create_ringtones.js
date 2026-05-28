const fs = require('fs');
const path = require('path');
const base64 = 'UklGRl9vT19teleikEk+Xr35hOJCaF29/kiVM7XJXr78uEYzxn5u3cjWdCdOvw2YloRnbq79qKaEZ46+/aimlHeurv2oppR3rq79qKaUd66u/aimlHeurv2oppR3rq79qKaUd66u/aimlHeurv2oppR3rq79qKaUd66u/aimlHeurv2oppRw==';
const buffer = Buffer.from(base64, 'base64');
const dir = path.join(__dirname, '..', 'public', 'sounds');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
for (let i = 1; i <= 8; i++) {
  fs.writeFileSync(path.join(dir, `ringtone${i}.wav`), buffer);
}
console.log('Created ringtone1.wav through ringtone8.wav in public/sounds');
