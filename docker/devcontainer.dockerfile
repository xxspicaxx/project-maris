FROM node:20-alpine

WORKDIR /workspace

# Install pnpm
RUN npm install -g pnpm@8

# Install tools development
RUN apk add --no-cache \
  git \
  openssl \
  curl \
  vim \
  bash \
  zsh \
  tmux \
  htop \
  jq \
  postgresql-client

# Copy project files for dependencies
COPY . .

# Install dependencies
RUN if [ -f package.json ]; then pnpm install; fi

# Keep container running
CMD ["tail", "-f", "/dev/null"]