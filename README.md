# Vader: Whiteout — Production Desk

Use Node 22. The frontend is in `client/`; the Nest/PostgreSQL backend is in
`server/`. Authentication remains with the existing Scheduler authority.

- [M03 implementation, evidence and deployment prerequisites](M03-REVIEW.md)
- [Isolated local preview and complete verification commands](qa/m03/README.md)
- [M03 research credits and runtime licenses](THIRD-PARTY-M03.md)
- [M02 foundation review](M02-REVIEW.md)

M03's additive migration runs only when explicitly requested. Automatic schema
synchronization is disabled. The local QA instructions use a dedicated loopback
database and test identities; they do not configure or deploy production services.
Current Shot Lists authorization and release requirements: [M03-ACCESS-CONTROL.md](M03-ACCESS-CONTROL.md).
