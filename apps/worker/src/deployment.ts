// An overall workflow success can include a skipped deploy job. Do not mistake it for a deployment.
export function deploymentResult(
  run: { status: string; conclusion: string | null; html_url: string },
  jobs: { name: string; conclusion: string | null }[],
) {
  const deploy = jobs.find((job) => job.name === 'deploy');
  return {
    status: run.status,
    conclusion:
      run.status !== 'completed'
        ? null
        : run.conclusion !== 'success'
          ? run.conclusion
          : deploy?.conclusion || 'not-deployed',
    url: run.html_url,
  };
}
