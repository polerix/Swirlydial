import { AdaJob, AdaReport } from './types';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const jobsDir = join(process.cwd(), 'ada-workspaces', 'jobs');

const jobQueue = {
  enqueue: async (job: AdaJob): Promise<void> => {
    const jobFilePath = join(jobsDir, `${job.id}.json`);
    await writeFile(jobFilePath, JSON.stringify(job, null, 2));
    console.log(`Enqueued job ${job.id} to ${jobFilePath}`);
  },
};

// This is a placeholder for the function that will be called by OpenClaw
// when a user invokes the !ada command.
export async function handleAdaCommand(command: string, args: string[]): Promise<void> {
  const [repo, ...restArgs] = args;
  const action = command as AdaJob['action'];

  const job: AdaJob = {
    id: `${new Date().toISOString()}-${Math.random().toString(36).substring(7)}`,
    repo,
    action,
    args: restArgs,
  };

  await jobQueue.enqueue(job);

  // In a real implementation, we would also have a mechanism to listen for
  // the result of the job and send a report back to Discord.
  // This could be done by listening to a Redis pub/sub channel,
  // watching a directory for new report files, or through a webhook.
}

// Example usage:
// handleAdaCommand('run', ['my-repo', '--cycles', '1']);
