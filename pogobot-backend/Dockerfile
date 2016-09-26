FROM node:6.6.0

RUN useradd --user-group --create-home --shell /bin/false app
#  npm install --global npm@3.10.3

ENV HOME=/home/app

COPY package.json npm-shrinkwrap.json $HOME/pogobot/
RUN chown -R app:app $HOME/*

USER app
WORKDIR $HOME/pogobot
RUN npm install

USER root
COPY . $HOME/pogobot
RUN chown -R app:app $HOME/*
USER app

CMD ["node", "rest.js"]
