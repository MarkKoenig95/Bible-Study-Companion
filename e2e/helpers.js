export async function waitForMS(milliseconds) {
  let wait = new Promise((res, rej) => {
    setTimeout(res, milliseconds);
  });
  await wait;
}
