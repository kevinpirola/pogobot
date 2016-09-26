FROM node:6.6.0

RUN useradd --user-group --create-home --shell /bin/false app

ENV HOME=/home/app
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8
ENV LC_ALL C.UTF-8

COPY package.json bower.json Gruntfile.js $HOME/pogobot/
RUN chown -R app:app $HOME/*

RUN npm install -g bower grunt-cli karma jasmine phantomjs simplehttpserver
RUN apt-get update; apt-get install -y ruby-full; gem install sass; gem install compass

USER app
WORKDIR $HOME/pogobot
RUN npm install; bower install

# RUN grunt build

USER root
COPY . $HOME/pogobot
RUN chown -R app:app $HOME/*
USER app

CMD ["grunt", "serve"]


