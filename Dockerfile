# Career Garden — Sandboxed Development Container
# Protocol: run agent-edited/untrusted code inside Docker, never on the host.
# The project directory is mounted read-write; the host's sensitive areas
# (vault, .hermes, keys) are NOT mounted and NOT reachable from this container.
#
# Build:   docker build -t career-garden-dev .
# Run:     docker compose up   (or docker run per the README)

FROM node:22-bookworm-slim

# pnpm needs its own home; Node 22 ships with corepack for pnpm.
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /workspace

# The project source is mounted at /workspace (see compose.yaml).
# Everything the app writes at build/dev time stays in the container or the
# mounted project dir — it cannot reach ~/.hermes, ~/Documents, or the host
# user's files because those are never mounted and the container has no
# credentials to them.

# Non-root user inside the container: the container's own "node" user.
# UID/GID are mapped to the host user via compose (user: "${UID}:${GID}").
# We do NOT hardcode USER node here because the compose `user:` directive
# overrides it, and the named volumes need to be writable by the host UID.
# The compose file sets user: "${UID:-1000}:${GID:-1000}" so the container
# process runs as the same UID as the host user, making the mounted project
# dir and named volumes writable.
# USER node

EXPOSE 8081

CMD ["pnpm", "--filter", "@workspace/mobile", "exec", "expo", "start", "--web", "--port", "8081"]
