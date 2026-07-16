# wip — version control where "commit" doesn't mean "publish to everyone"

## Problem

Git has exactly one read permission: all. Anything committed is readable by everyone with repo access, forever. Consequences teams have normalized:

- Security fixes developed in out-of-band private forks, patch-over-email, ceremony outside the VCS.
- Companies split monorepos not for size (tooling solved that) but for **access control**, then pay for it in dependency hell.
- Secrets can't live in the repo at all, so every team bolts on a parallel universe: Vault, SOPS, sealed-secrets, .env files passed over Slack. Config and the code that consumes it are versioned in different systems with different access models, and drift between them causes real outages.
- HR configs and unreleased-product code live in scattered side repos or, worse, leak into history.

Separately, git's daily UX carries 20 years of accumulated fear: staging area, stash, detached HEAD, rebase-conflict lockups, force-push, lost work. Jujutsu (jj) has already proven a better model. Nobody has combined it with cryptographic read scopes.

## Product

**wip**: a VCS built on a forked jj-lib (Apache-2.0, Rust), with:

1. **Sealed changes.** `wip commit --seal sec-team` encrypts content, message, and paths. World sees an opaque blob in the DAG. Per-change data key, wrapped per recipient (HPKE). A salted plaintext commitment sits inside the hashed portion, so `wip reveal` = publish a 32-byte key: the change becomes world-readable with the **same hash**, no rewrite, no rebase, review threads intact. Coordinated vulnerability disclosure becomes a native workflow.
2. **Standing path scopes** for monorepos and secrets. `wip scope create /payments --readers payments-team`. File deltas under the path auto-encrypt; the rest of the commit stays public. A metadata-only tier ("file changed, 40 lines") keeps builds, blame, and logs coherent for non-readers. Same mechanism gives secrets a legitimate home in the repo: encrypted config versioned in the same commits as the code that consumes it, readable only by the deploy scope. wip is not a runtime secrets manager (no dynamic leases, no runtime audit), it replaces the SOPS/git-crypt/.env layer, and complements Vault above it. Pitch: *one repo for the whole company, where reads have owners too.*
3. **jj's proven model**: working copy is a commit (no staging, no stash), stable change IDs across rewrites, first-class conflicts (rebase never blocks), operation log with universal undo.
4. **Coach mode.** Git commands work as aliases, do the wip-native thing, and explain the difference in one line. Muscle memory converts organically. `wip init --coexist` runs inside an existing git repo; for public work, colleagues, CI, and GitHub never notice. Sealed content surfaces to plain-git colleagues as LFS-style opaque pointer files, never as editable text. Adoption unit = one developer.
5. **SQLite storage, filesystem as adapter.** Two databases: `repo.db` (syncable, safe to replicate anywhere) and `local.db` (never syncs: worktree state, plaintext cache). Working copy is a pluggable adapter: native FS, virtual FS (ProjFS/FUSE/FSKit), headless (API-only, for CI and AI agents), WASM/OPFS later. Db-as-truth quarantines the cross-platform bug zoo (case collisions, unicode normalization, path limits, CRLF) to the checkout adapter: lossy mappings are detected and warned, never silently committed as repo truth.
6. **Server as optimization, never as trust root.** Fully functional offline; any dumb remote (GitHub, S3) carries ciphertext. A server adds fetch ACLs (existence hiding), forward revocation, equivocation prevention, review UI, and lazy fetch at monorepo scale. That server/service is also the business model.

## Key design decisions

- **Identity from SSH keys, decryption from dedicated keys.** SSH keys (already deployed, published at github.com/user.keys) sign a per-device X25519 decryption key. Works with ssh-agent and hardware keys; SSH key rotation doesn't destroy access.
- **Seal taint is viral.** Squash/merge/rebase output label = join of input labels. Loosening only by explicit reveal/grant. Information-flow control, not convention.
- **Dedup sacrificed across seal scopes.** Sealed chunks are addressed by ciphertext; convergent encryption across scopes would enable confirmation attacks. Storage cost accepted deliberately.
- **Permission checks are cryptography, not if-statements.** No wrap row = the bytes are noise to you.
- **Exit is a feature, and a precondition.** Published format spec, a standalone offline export/decrypt tool, and a git-flattening path must exist before anyone is asked to trust sealed history to wip. If the company dies, customers keep their bytes and their keys.
- **Revert is the default state, not a command.** Colocation keeps the git projection valid continuously: `rm -rf .wip/` and the repo is a plain git repo, was one all along. `wip eject [--to git|jj]` handles the lossy parts explicitly: unpushed changes become branches, op log is archived, stored conflicts materialize with markers, and sealed changes leave as ciphertext bundles plus your keys — eject never declassifies team-sealed content. Eject to jj is near-lossless. The demo ends with deleting `.wip/` live and running `git log`.

## Culprits — what can kill this, stated plainly

1. **Adoption gravity.** Git won on network effects; hg and bzr died anyway. Mitigation is the entire coexist/coach strategy, but it remains the #1 risk. wip must be adoptable by one engineer, invisibly, with zero team buy-in, or it dies.
2. **Revocation is forward-only.** Crypto cannot retract bytes someone already fetched. Honest framing required: revoke = stop future fetches + rotate keys. Overselling this destroys credibility with the exact security audience the product courts.
3. **Metadata leaks.** A sealed blob on a public remote leaks existence, size, timing, and recipient list; for an embargoed exploit fix, existence alone tips attackers. Requires the "dark" tier (keyholder-only sync) and discipline in defaults. Easy to get subtly wrong.
4. **Sealed content breaks consumers.** Teammates can't build code they can't read; nobody can merge what they can't decrypt. Mitigations (metadata-only tier, scope boundaries aligned to build graph, awaiting-keyholder rebase states) are designed but unproven at scale.
5. **Fork maintenance.** jj-lib is pre-1.0 and churning. Label propagation hooks cut below the pluggable-backend boundary, so wip carries a real fork. Strategy: keep it surgical, upstream generic hooks, accept the rebase tax.
6. **Key loss = data loss.** Lose every wrapped copy of a data key and the sealed history is gone, permanently. Needs org escrow/recovery keys by default, which reintroduces trust decisions the product must surface honestly rather than hide. Secrets-in-repo raises these stakes further: an unreadable sealed scope containing production config is an outage, not just lost history.
7. **Auto-snapshot vs secrecy.** A tool whose pitch is confidentiality must not auto-record `.env` into synced history. Paranoid ignore defaults, size guards, and undo coaching are mandatory, not polish.
8. **Crypto review burden.** Commitments, HPKE envelopes, key rotation, convergent-encryption pitfalls: this needs professional cryptographic review before anyone trusts an embargoed 0-day or production secret to it. Budget for audits; "we rolled our own" is disqualifying in this market.
9. **Ecosystem surface.** Hooks, IDE integrations, submodules, LFS-class files: each gap bounces a real team. Git interop covers most, headless API helps tooling, but the long tail is long.

## Why now

Supermodel-class coding agents change two things: the multi-year build-a-VCS effort is compressible, and agents themselves are a new VCS client. Headless mode with crypto-enforced path scopes means an AI agent physically cannot read code it isn't granted — an answer to a question every engineering org is currently asking. jj's rise proves the market will move off git's UX; nobody has yet given it a reason to move off git's trust model.

## What wip is not

Not a blockchain, no tokens. Not end-to-end "zero-trust collaboration" theater: the server, when used, is honestly scoped. Not a runtime secrets manager: it versions encrypted config, it does not lease database credentials. Not a git killer by frontal assault: it lives inside git repos until it doesn't need to.

