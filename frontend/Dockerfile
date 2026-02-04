FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install

# Copy project
COPY . .

# Expose port
EXPOSE 5173

# Default command
CMD ["bun", "run", "dev", "--host"]

