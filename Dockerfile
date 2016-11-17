FROM python:3.5
MAINTAINER Open State Foundation <developers@openstate.eu>

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
        rubygems \
        apt-transport-https \
        ca-certificates
RUN apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
RUN echo 'deb https://apt.dockerproject.org/repo debian-jessie main' > /etc/apt/sources.list.d/docker.list
RUN apt-get update
RUN apt-get install -y docker-engine

WORKDIR /opt/pulse

COPY requirements.txt .
RUN pip install -r requirements.txt
RUN gem install sass bourbon neat bitters

EXPOSE 5000

CMD make debug
