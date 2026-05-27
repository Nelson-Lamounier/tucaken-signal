export async function animatePreview(text: string): Promise<void> {
  const lines = text.split("\n");
  for (const line of lines) {
    process.stdout.write(line + "\n");
    // Tier transitions get a small pause to signal scan windows
    if (/0:00.0:30/.test(line)) await sleep(700);
    else if (/0:30.2:00/.test(line)) await sleep(900);
    else if (/2:00\+/.test(line)) await sleep(900);
    else await sleep(35);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
