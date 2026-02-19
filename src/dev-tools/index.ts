export async function initDevTools() {
  if (process.env.REACT_APP_REACT_SCAN === 'true') {
    const { scan } = await import('react-scan');
    scan({ enabled: true, log: true });
  }
}
