# pnpm Quick Reference

## Common Commands

| Task                    | Command                          |
| ----------------------- | -------------------------------- |
| Install dependencies    | `pnpm install`                   |
| Install (CI/Production) | `pnpm install --frozen-lockfile` |
| Add dependency          | `pnpm add <package>`             |
| Add dev dependency      | `pnpm add -D <package>`          |
| Remove dependency       | `pnpm remove <package>`          |
| Update all dependencies | `pnpm update`                    |
| Update specific package | `pnpm update <package>`          |

## Project Scripts

| Task                   | Command              |
| ---------------------- | -------------------- |
| Start dev server       | `pnpm dev`           |
| Build production       | `pnpm build`         |
| Preview build          | `pnpm preview`       |
| Run linter             | `pnpm lint`          |
| Run tests              | `pnpm test`          |
| Test with UI           | `pnpm test:ui`       |
| Test coverage          | `pnpm test:coverage` |
| Deploy to GitHub Pages | `pnpm deploy`        |

## Workspace Commands

| Task                             | Command                              |
| -------------------------------- | ------------------------------------ |
| Run script in specific workspace | `pnpm --filter <workspace> <script>` |
| Install for all workspaces       | `pnpm install -r`                    |
| Run script in all workspaces     | `pnpm -r <script>`                   |

### Examples

```bash
# Run build in api workspace only
pnpm --filter api build

# Install dependencies for functions workspace
pnpm --filter functions install
```

## Useful Flags

| Flag                  | Purpose                               |
| --------------------- | ------------------------------------- |
| `--frozen-lockfile`   | Don't update lockfile (CI/Production) |
| `-D` or `--save-dev`  | Install as dev dependency             |
| `-g` or `--global`    | Install globally                      |
| `--force`             | Force re-download packages            |
| `-r` or `--recursive` | Run in all workspace packages         |
| `--filter <pattern>`  | Run in specific workspace             |

## Performance Tips

- **Faster than npm/yarn**: pnpm uses hard links and symlinks
- **Disk space**: Global store prevents duplicate packages
- **Strict mode**: Phantom dependencies are prevented by default

## Troubleshooting

### Clear cache

```bash
pnpm store prune
```

### Rebuild node_modules

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Check outdated packages

```bash
pnpm outdated
```

### Interactive update

```bash
pnpm update --interactive
```

## Migration from npm

| npm                   | pnpm                             |
| --------------------- | -------------------------------- |
| `npm install`         | `pnpm install`                   |
| `npm ci`              | `pnpm install --frozen-lockfile` |
| `npm run <script>`    | `pnpm <script>`                  |
| `npm install <pkg>`   | `pnpm add <pkg>`                 |
| `npm uninstall <pkg>` | `pnpm remove <pkg>`              |
| `npm update`          | `pnpm update`                    |

## Configuration Files

- **`.npmrc`** - pnpm settings
- **`pnpm-workspace.yaml`** - Workspace configuration
- **`pnpm-lock.yaml`** - Dependency lockfile (like package-lock.json)

---

For full documentation: https://pnpm.io
