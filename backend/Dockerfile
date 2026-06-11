FROM ruby:3.1-slim AS base

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
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN gem install bundler

# ── Production ───────────────────────────────────────────────────────────────
FROM base AS production

COPY Gemfile Gemfile.lock ./
RUN bundle config set --local without 'development test' && \
    bundle install --jobs 4 --retry 3

COPY . .
RUN mkdir -p tmp/pids log

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]

ENV RAILS_ENV=production \
    RAILS_LOG_TO_STDOUT=true

EXPOSE 3000
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]

# ── Development (default — dev compose overrides via volume mount + command) ──
FROM base AS development

COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY . .
RUN mkdir -p tmp/pids log

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 3000
CMD ["rails", "server", "-b", "0.0.0.0"]
