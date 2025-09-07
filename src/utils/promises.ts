export function promiseAllSettledWithProgress(
  promises: Promise<any>[],
  progressCallback: (percentage: number) => void
) {
  let settled = 0;
  const total = promises.length;

  function updateProgress() {
    settled++;
    const percentage = Math.round((settled / total) * 100);
    progressCallback(percentage);
  }

  const progressTrackingPromises = promises.map((promise) => {
    return promise
      .then((value) => {
        updateProgress();
        return value;
      })
      .catch((error) => {
        updateProgress();
        return Promise.reject(error);
      });
  });

  return Promise.allSettled(progressTrackingPromises);
}
