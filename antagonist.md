# Antagonist review: "wip" one-pager

## Persona 1 — Staff engineer, VCS graveyard veteran

1. **Wedge contradiction.** "Adoption unit = one developer" — but the only differentiating feature, sealing, is worthless to a developer alone. A solo adopter gets jj's model, which they can get today from jj itself, colocated, with zero fork risk and an upstream that isn't you. What does developer #1 get from wip that `jj git init --colocate` doesn't already give them, and if the answer is "nothing until the team seals", how is the adoption unit one developer?

2. **"colleagues, CI, and GitHub never notice"** — until the first sealed commit lands in the shared repo. Walk through the exact bytes: a plain-git colleague pulls a sealed change touching a file they're mid-edit on. What's in the git tree object — an opaque blob replacing the file? What does their merge conflict against ciphertext look like? "Never notice" and "sealed changes in the DAG" cannot both be true; which one is the demo and which one is the product?

3. **Same-hash reveal vs git interop.** Git hashes are functions of tree contents. If `wip reveal` makes the change "world-readable with the **same hash**, no rewrite", then the hash must cover ciphertext — meaning after reveal, the colocated git side still contains ciphertext and `git blame`, `git bisect`, `git grep` stay blind to that change forever. Or you rewrite the git side and break "no rewrite". Which half of the claim are you giving up?

4. **"Db-as-truth kills the cross-platform bug zoo (case collisions, unicode normalization, path limits, CRLF)."** Colocation and the native-FS adapter still materialize real files onto real filesystems — that checkout is where every one of those bugs lives. What did SQLite actually kill besides the index format?

5. **"Keep it surgical"** — while label propagation "cuts below the pluggable-backend boundary" of a pre-1.0 library that churns weekly. hg evolve, bzr's format treadmill, and Pijul's theory rewrites all died under exactly this maintenance load. Give me the number: engineer-months per year of rebase tax you'll pay before you stop tracking upstream, and once you hard-fork, who is maintaining an entire VCS core?

6. **Metadata-only tier "keeps builds, blame, and logs coherent for non-readers."** A build needs file contents; blame needs line contents. "file changed, 40 lines" compiles nothing and attributes nothing. What does a non-reader's `bazel build //payments/...` do — fail, fetch a granted binary artifact from a service you haven't designed, or silently use a stale plaintext cache?

7. **The monorepo pitch requires the whole org.** "One repo for the whole company, where reads have owners too" only works after everyone is on wip and every consumer of a scoped path has keys or artifacts — total migration, the thing Culprit 1 says kills you. The single-dev product and the monorepo product are two different companies. Which one is this?

## Persona 2 — Cryptographer, due diligence for embargoed 0-day storage

8. **"`wip reveal` = publish a 32-byte key."** Which key? If it's the per-change data key, every recipient already had it and reveal is mere widening — plus you've now published a key that may also wrap other material. If it's the commitment salt, a salt decrypts nothing. Specify the commitment scheme, its binding property, and the proof that a malicious sealer cannot open a sealed change to a *different* plaintext at reveal time. "Review threads intact" against swapped code is strictly worse than no review.

9. **Group resolution and insider threat.** `--sealed-to sec-team`: resolved when, by whom, against what membership root? A hire joins sec-team next week — who holds the data key to rewrap for them, and what stops any current recipient from silently wrapping it for an outsider? There is no traitor tracing here: any of N recipients leaks the 0-day untraceably. For the exact market you're courting, what's the answer beyond "trust all N"?

10. **You made GitHub the trust root.** Device X25519 keys are signed by SSH keys "published at github.com/user.keys," in a document whose design pillar is "never as trust root." GitHub account compromise = attacker enrolls a device key and reads every future seal addressed to that identity, silently. Where is the key transparency log, cross-signing, or even TOFU pinning?

11. **Zero forward secrecy, public ciphertext, indefinite exposure.** Static HPKE wraps on "any dumb remote (GitHub, S3)" means one recipient device key compromised in 2029 decrypts every fix sealed to them since 2026 — harvest-now-decrypt-later against a corpus you've helpfully mirrored to a public CDN. Why is that acceptable for embargoed vulnerabilities, and where's the rewrap/rotation story for data at rest?

12. **"Permission checks are cryptography, not if-statements"** — then the server adds "fetch ACLs" and "forward revocation," which are if-statements, and Culprit 2 admits revocation isn't cryptographic at all. Enumerate, per feature, which guarantee is cryptographic and which is policy enforced by a server you elsewhere call optional. And where is the actual threat model document? "Budget for audits" is a line item, not an assurance argument; `wip reveal` is IFC declassification with no stated policy, which is precisely where IFC systems break.

13. **The "dark tier" is one sentence carrying your flagship use case.** If keyholder-only changes don't sync to the shared remote, non-keyholders hold a DAG with dangling parents — what does their log, fetch, and merge do at the hole? If they do sync, "existence alone tips attackers" by your own Culprit 3. Pick one and specify it.

14. **Within-scope dedup = within-scope oracle.** "Dedup sacrificed across seal scopes" implies dedup *within* a scope, which implies deterministic encryption within scope. Anyone holding scope chunk hashes can confirm whether the sealed change touches a known file or contains a guessed patch — a confirmation attack by exactly the semi-trusted co-members and infrastructure you kept. Addressed, or is Culprit 3 understated?

15. **Escrow is the product refuting itself.** "Needs org escrow/recovery keys by default" — a key that decrypts every embargoed 0-day the org has ever sealed. Where does it live, who can invoke it, what's the audit trail, and how is it meaningfully different from the trusted server you disclaim? Then the concrete case: the sole keyholder of a sealed hotfix quits, YubiKey in pocket, escrow was never configured. Walk through recovery. (There isn't one — say so in the doc.)

## Persona 3 — Engineering director / investor

16. **"That server/service is also the business model"** — one paragraph after designing it out: "fully functional offline; any dumb remote (GitHub, S3) carries ciphertext." Your free single-dev path never touches the server; your paid path requires the whole-org migration you rank as risk #1. Name the first paying customer profile, what specifically they pay for, and why they don't run GitHub+S3 forever — or why GitHub doesn't ship sealed refs themselves once you've validated the market.

17. **Scope vs headcount.** Forked VCS core + novel cryptosystem + three virtual filesystems (ProjFS/FUSE/FSKit) + WASM/OPFS + headless API + review UI + server. "The multi-year build-a-VCS effort is compressible" by coding agents — agents don't compress the crypto audit, Windows filesystem edge cases, or the Culprit-9 long tail you admit "bounces a real team." What's the team size and runway for years 1–3, and what gets cut first?

18. **CI with sealed code.** Either CI holds wrapped keys — making third-party runners the largest key concentration in a 500-person org, one runner compromise from full embargo loss — or sealed paths don't build in CI and your embargoed security fix ships untested. Which one, and how does either pass a SOC 2 / change-management audit?

19. **Legal has not seen this.** Sealed history is still discoverable: legal hold against changes whose only keyholder left, or whose keys were "lost," is spoliation exposure. In reverse, `--sealed-to` self plus push is a company-sanctioned encrypted exfiltration channel through corporate remotes that DLP cannot inspect — "the bytes are noise" to your own security team too. What's the compliance posture for eDiscovery, export control, and insider exfil?

20. **Year-3 hostage scenario.** wip-the-company dies. Customers hold repos whose sealed history is ciphertext readable only through your jj fork and your key formats. "It lives inside git repos until it doesn't need to" — the moment it doesn't, the exit door closes. Where is the committed format spec, standalone key-export/decrypt tool, and git-flattening path that survives the company, and why isn't that in the one-pager as a precondition rather than an afterthought?
