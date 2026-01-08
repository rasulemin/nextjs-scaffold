# next-scaffold

As a freelance developer who builds a lot of SaaS MVPs, I start a lot of Next.js projects and found myself doing the same setup steps over and over. So I built this quick setup tool for myself. If there's interest, I'm happy to make it more flexible - feel free to open an issue or send a PR!

## What it does

When you run this tool, it automatically:

- Sets up **Prettier** with my preferred config and adds a `format` script (you can specify your own config file)
- Configures **ESLint** using [@antfu/eslint-config](https://github.com/antfu/eslint-config) with Next.js support
- Removes the default SVG files from the `public` directory
- Cleans up the home page (`page.tsx`) with a minimal starting point
- Changes the default font from Geist to **Inter**
- Adds a container utility class to `globals.css` for consistent layout spacing
- Runs formatters and linters to clean everything up

## Installation

```bash
npm install -g next-scaffold
# or
pnpm add -g next-scaffold
```

## Usage

Navigate to your freshly created Next.js project and run:

```bash
next-scaffold
```

The tool will ask for confirmation before making any changes. If you're not sure, you can press Enter to cancel.

### Options

You can skip specific steps if you want:

```bash
next-scaffold --skip-prettier            # Skip Prettier setup
next-scaffold --skip-eslint              # Skip ESLint setup
next-scaffold --skip-cleanup             # Skip public directory cleanup
next-scaffold --skip-homepage            # Skip homepage update
next-scaffold --skip-font-change         # Skip font change (Geist to Inter)
next-scaffold --skip-container-utility   # Skip adding container utility to globals.css
```

Use your own Prettier config:

```bash
next-scaffold --prettier-config ./my-prettier-config.json
```

Combine multiple options:

```bash
next-scaffold --skip-cleanup --skip-homepage --skip-font-change
```

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build
```

## License

MIT © Rasul Emin
