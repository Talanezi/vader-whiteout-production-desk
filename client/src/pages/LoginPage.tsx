function LoginPage() {
  return (
    <div className="vw-page-wrap">
      <section className="vw-section-card vw-auth-card">
        <p className="vw-kicker">Production Desk</p>
        <h1 className="vw-page-title">Please Log In</h1>
        <p className="vw-page-note">
          Production Desk uses the same scheduler session. Log in through scheduler, then come back here.
        </p>

        <div className="vw-actions-row">
          <a className="vw-btn vw-btn-primary" href="/scheduler/#/login">
            Log In
          </a>
          <a className="vw-btn" href="/scheduler/#/signup">
            Sign Up
          </a>
        </div>
      </section>
    </div>
  )
}

export default LoginPage
