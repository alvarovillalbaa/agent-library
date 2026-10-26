import { spawnSync } from 'node:child_process';

const hasDeployKey = Boolean(process.env.CONVEX_DEPLOY_KEY);
const command = hasDeployKey ? 'convex' : 'vite';
const args = hasDeployKey
  ? ['deploy', '--typecheck', 'disable', '--cmd', 'npm run build', '--cmd-url-env-var-name', 'VITE_CONVEX_URL']
  : ['build'];

if (!hasDeployKey) console.info('Building the catalogue UI without a Convex deployment update.');
const result = spawnSync(command, args, { stdio: 'inherit', env: process.env });
if (result.error) {
  console.error('The hosted build command could not start.');
  process.exit(1);
}
process.exit(result.status ?? 1);
