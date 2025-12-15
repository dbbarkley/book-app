FROM ruby:3.1-slim

# Install all system dependencies in one layer
RUN apt-get update -qq && \
    apt-get install -y \
    build-essential \
    libpq-dev \
    libyaml-dev \
    libffi-dev \
    libgdbm-dev \
    libncurses5-dev \
    libreadline-dev \
    libssl-dev \
    zlib1g-dev \
    nodejs \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install bundler
RUN gem install bundler

# Copy Gemfile and install dependencies
COPY Gemfile* ./
RUN bundle install

# Copy application code
COPY . .

# Create tmp and log directories
RUN mkdir -p tmp/pids log

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]

# Expose port
EXPOSE 3000

# Default command
CMD ["rails", "server", "-b", "0.0.0.0"]

