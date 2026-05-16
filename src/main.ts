/** App entrypoint: bootstrap the App orchestrator. */
import './style.css';
import { App } from './app';

const app = new App();
app.start().catch((err) => {
  console.error('App failed to start:', err);
  document.body.innerHTML = `<pre style="color:#f87171;padding:24px;">Boot failed: ${err?.message ?? err}</pre>`;
});
