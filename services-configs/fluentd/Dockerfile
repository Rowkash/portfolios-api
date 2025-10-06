FROM fluent/fluentd:v1.16-debian

USER root

RUN gem install fluent-plugin-docker_metadata_filter --no-document \
 && gem install fluent-plugin-record-modifier --no-document \
    && fluent-gem install fluent-plugin-elasticsearch --no-document

# COPY ./conf /fluentd/etc
