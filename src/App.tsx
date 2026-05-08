export function App() {
  return (
    <main className="shell">
      <section className="hero" aria-labelledby="app-title">
        <p className="eyebrow">Private bedtime magic for traveling parents</p>
        <h1 id="app-title">Little Voice Stories</h1>
        <p>
          Upload a kid's drawing, shape it into a bedtime character, and create
          a cozy narrated story right in the browser.
        </p>
        <div className="hero__links">
          <a href="https://github.com/baditaflorin/little-voice-stories">
            GitHub
          </a>
          <a href="https://www.paypal.com/paypalme/florinbadita">PayPal</a>
        </div>
      </section>
      <section className="placeholder" aria-label="Implementation status">
        <p>Implementation is starting. The full app will land in the next commits.</p>
        <small>
          Version {__APP_VERSION__} · Commit {__GIT_COMMIT__}
        </small>
      </section>
    </main>
  );
}
