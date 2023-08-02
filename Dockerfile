FROM node:16-bullseye-slim as base

RUN apt-get update && \
  apt-get install --no-install-recommends -y \
  build-essential \
  python3 && \
  rm -fr /var/lib/apt/lists/* && \
  rm -rf /etc/apt/sources.list.d/*

RUN npm install --global --quiet npm truffle

FROM base as truffle

RUN mkdir -p /home/etn-sc-contracts
WORKDIR /home/etn-sc-contracts

COPY package.json /home/etn-sc-contracts
COPY package-lock.json /home/etn-sc-contracts

RUN npm install --quiet

COPY truffle-config.js /home/etn-sc-contracts
COPY contracts /home/etn-sc-contracts/contracts
COPY migrations /home/etn-sc-contracts/migrations/
COPY test /home/etn-sc-contracts/test/

CMD ["truffle", "version"]
