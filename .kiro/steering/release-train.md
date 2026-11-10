---
inclusion: manual
name: Release Train
description: Release and hotfix workflow
---

# Release Train

Load this steering file manually when preparing a release.

## Release Flow

1. Create `release/X.Y.Z` branch from `main`
2. Run FT (functional testing)
3. Run NFT (non-functional testing)
4. Run security scan
5. Tag: `vX.Y.Z`
6. Merge back to `main`

## Hotfix Flow

1. Branch `hotfix/*` from `release/X.Y.Z`, **never from main**
2. Apply fix
3. Tag: `vX.Y.Z+1`
4. Cherry-pick to `main` if applicable

## Tag Rules

- Never delete a deployed tag
- Rollback = redeploy previous tag + `git revert`

## Conflict Resolution

Use `cherry-pick-*` branch pattern for complex merges.
