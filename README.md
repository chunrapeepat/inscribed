# Inscribed

A slide-based tool for creating stop motion animations and slides with Excalidraw

![Inscribed App Interface](./docs/imgs/screenshot.png)

🎥 [Watch Demo](https://youtu.be/CLJvvGVErMY) | 🚀 [Try Inscribed](https://inscribed.app) | [Feedback](https://github.com/chunrapeepat/inscribed/issues)

## Tutorials

- [How to use Google fonts?](./docs/custom-fonts.md)
- [How each export options work?](./docs/export-options.md)

## Features

- 🎨 Interactive drawing canvas powered by Excalidraw
- ⌨️ Keyboard shortcuts support
  - Copy/Paste/Duplicate functionality
  - Navigation with Up/Down arrows
  - Delete items
- 📏 Customizable document size
- 🖼️ Image import and manipulation
- 🔤 Google Fonts integration
- 🎭 Presentation mode for slideshows
- 📤 Export presentations as GIF
- 💾 Export/Import data functionality
- 🔗 Embed support via iframe, hosted on Gist

## Getting Started

### Local Development

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/inscribed.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `pnpm install`
5. Start the development server: `pnpm dev`

### Using Docker

#### Development

```bash
# Start the development server
docker compose up dev

# Or build and run in one command
docker compose up dev --build
```

After running either of these commands, open your browser and navigate to:

```
http://localhost:5173
```

To use a different port (e.g., 3000), change the first number in the port mapping in docker-compose.yml:

```bash
# Edit the docker-compose.yml file, changing "5173:5173" to "3000:5173"
```

Then access the development server at `http://localhost:<HOST_PORT>`.

#### Production

```bash
# Build and start the production server
docker compose up prod --build -d

# Or use Docker directly
docker build -t inscribed:latest .
docker run -p 8888:80 inscribed:latest
```

After running either of these commands, open your browser and navigate to:

```
http://localhost:8888
```

To use a different port (e.g., 3000), change the first number in the port mapping:

```bash
# Using docker-compose
# Edit the docker-compose.yml file, changing "8888:80" to "3000:80"

# Using Docker directly
docker run -p 3000:80 inscribed:latest
```

## Deployment

### Self-Hosting with Docker

1. Clone the repository: `git clone https://github.com/chunrapeepat/inscribed.git`
2. Build the Docker image: `docker build -t inscribed:latest .`
3. Run the container: `docker run -d -p 8888:80 inscribed:latest`

The application will be available at `http://localhost:8888` or your server's IP/domain on port 8888.

To customize the port, change the host port mapping in the docker run command:

```bash
# Format: docker run -d -p <HOST_PORT>:80 inscribed:latest
# Example for port 9000:
docker run -d -p 9000:80 inscribed:latest
```

Then access the application at `http://localhost:<HOST_PORT>`.

## Changelog

- [12/5/2025] [v1.1.1](https://github.com/chunrapeepat/inscribed/pull/47) - minor improvements for animation recording usecase

- [25/4/2025] [v1.1.0](https://github.com/chunrapeepat/inscribed/pull/34) - export as video, integrate [excalidraw-animate](https://github.com/dai-shi/excalidraw-animate)

- [24/4/2025] [v1.0.7](https://github.com/chunrapeepat/inscribed/pull/33) - fix all reported bugs on Github issues

- [26/3/2025] [v1.0.6](https://github.com/chunrapeepat/inscribed/pull/12) - raw gist url supported, drag and drop to import, cmd/ctrl + s shortcut for export, minor ux improvements.

- [25/3/2025] [v1.0.5](https://github.com/chunrapeepat/inscribed/pull/10) - fix bugs, minor improvements

- [12/3/2025] [v1.0.4](https://github.com/chunrapeepat/inscribed/pull/9) - preview GIF, import directly from Gist, make share url shorter

- [12/3/2025] [v1.0.3](https://github.com/chunrapeepat/inscribed/pull/8) - swipe down to exit presentation, multi-select preview items, improve pref

- [11/3/2025] v1.0.2-hotfix - support gist with multiple files, shareable url

- [23/2/2025] [v1.0.2](https://github.com/chunrapeepat/inscribed/pull/5) - slide bar ux improvement

- [16/2/2025] [v1.0.1](https://github.com/chunrapeepat/inscribed/pull/1) - ux improvement and indexeddb migration

- [11/2/2025] [v1.0.0](https://www.youtube.com/watch?v=CLJvvGVErMY) - launch an MVP
  - shortcuts: copy/paste, up/down/delete
  - integrated google fonts
  - export: gif, iframe embed
  - full-screen presentation mode

---

Crafted with 🧡 by [@chunrapeepat](https://chunrapeepat.com)
