import { spawn } from 'node:child_process';
import readline from 'node:readline';

const email = process.argv[2] || 'inyakindmitry1@gmail.com';
const password = process.argv[3] || 'DeteBooking2026!';
const domain = process.argv[4] || 'dete-studios.surge.sh';

console.log(`Deploying to Surge with email: ${email}, domain: ${domain}...`);

const surgeCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(surgeCmd, ['surge', 'dist', domain], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true,
});

child.stdout.on('data', (data) => {
  const str = data.toString();
  process.stdout.write(str);

  if (str.includes('email:')) {
    child.stdin.write(email + '\n');
  } else if (str.includes('password:')) {
    child.stdin.write(password + '\n');
  }
});

child.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

child.on('close', (code) => {
  console.log(`Surge process exited with code ${code}`);
  process.exit(code);
});
