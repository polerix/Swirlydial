import { readdir, watch, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';
import { AdaJob, AdaReport } from './types';

const jobsDir = join(process.cwd(), 'ada-workspaces', 'jobs');
const reportsDir = (repo: string) => join(process.cwd(), 'ada-workspaces', repo, 'reports');

async function executeJob(job: AdaJob): Promise<Omit<AdaReport, 'job_id'>> {
  return new Promise((resolve) => {
    const adaProcess = spawn('ada', [job.action, job.repo, ...(job.args || [])]);

    let stdout = '';
    let stderr = '';

    adaProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    adaProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    adaProcess.on('close', (code) => {
      if (code === 0) {
        resolve({
          summary: stdout,
        });
      } else {
        resolve({
          summary: 'Job failed',
          error: stderr,
        });
      }
    });
  });
}

async function processJob(jobFile: string) {
  const jobFilePath = join(jobsDir, jobFile);
  try {
    const job: AdaJob = JSON.parse(await readFile(jobFilePath, 'utf-8'));
    console.log(`Processing job ${job.id}`);

    const report = await executeJob(job);

    const reportFilePath = join(reportsDir(job.repo), `${job.id}.json`);
    await writeFile(reportFilePath, JSON.stringify({ ...report, job_id: job.id }, null, 2));
    console.log(`Wrote report for job ${job.id} to ${reportFilePath}`);

    await rm(jobFilePath);
    console.log(`Deleted job file ${jobFile}`);
  } catch (error) {
    console.error(`Error processing job file ${jobFile}:`, error);
  }
}

async function startWorker() {
  console.log('ADA worker started, watching for jobs in', jobsDir);

  // Process any existing jobs
  const existingJobs = await readdir(jobsDir);
  for (const jobFile of existingJobs) {
    if (jobFile.endsWith('.json')) {
      await processJob(jobFile);
    }
  }

  // Watch for new jobs
  const watcher = watch(jobsDir);
  for await (const event of watcher) {
    if (event.eventType === 'rename' && event.filename && event.filename.endsWith('.json')) {
      // The file might not be fully written yet, wait a bit
      setTimeout(() => processJob(event.filename!), 100);
    }
  }
}

startWorker().catch(console.error);
