# wip

> Version control where "commit" doesn't mean "publish to everyone".

A design RFC for a post-git VCS: [jj](https://github.com/jj-vcs/jj)'s change model plus cryptographic read scopes. Sealed changes, per-path access, universal undo, and it lives inside your existing git repo. **There is no code yet.** The design is published for hostile review, and the most useful thing you can do is break it.

## Read

- [The pitch, kill list, and open questions](https://wip-scm.org)
- [The full RFC](https://wip-scm.org/rfc.html), including a plain-words walkthrough of how the keys work
- [Hostile review of the system](antagonist.md), from the adversarial rounds that preceded publication

## Argue

[Discussions](https://github.com/bitbonsai/wip-scm/discussions) is the place. Break the sealing scheme, find the metadata leak, tell us the build-graph answer can't work.

## Status

Free forever. Apache-2.0 when there is code. Exit to plain git, anytime, by design.

`website/` is the source of [wip-scm.org](https://wip-scm.org).
