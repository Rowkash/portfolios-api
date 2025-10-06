Hi👋 My name is Ruslan.

I'm backend Node.js developer and this is my portfolio. I create templates for REST API projects based on NestJS framework. It's just REST API for creating portfolios. Users can create their own portfolios, uploads images to them, watch other user's portfolios.

**Main projects goals**:

- My ability to build clean, maintainable backend architectures
- Work with different technologies, patterns
- Use reusable NestJS modules and components across projects

**Common Stack**:

- **NestJS** — modern and structured Node.js framework
- **Auth** — login/password and JWT Token-Based authentications
- **Redis** — for session storage, queues storage
- **MinIO** — S3-compatible object storage for portfolio images
- **Docker Compose** — containerized services setup
- **BullMQ** — library for background job queues
- **Pino** — structured logging with `nestjs-pino` library
- **Rate limiting** — via `@nestjs/throttler`
- **Serialization** — using `class-transformer`
- **Jest** — for testing

[nestjs-typeorm](https://github.com/Rowkash/nestjs-typeorm-template)
template features:

- **Postgres** + **TypeORM**
- **Logging**: ELK (Elasticsearch, Logstash, Kibana) stack

[nestjs-sequelize](https://github.com/Rowkash/nestjs-sequelize-template)
template features:

- **Postgres** + **Sequelize ORM**
- **Logging stack**: EFK (Elasticsearch, Fluentd, Kibana)

[nestjs-mongo](https://github.com/Rowkash/nestjs-mongo-template)
template features:

- **Mongo** + **Mongoose ORM**
- **Logging stack**: Grafana Stack (Loki, Promtail, Grafana)
- **Metrics**: **Prometheus** with `prom-client` library

**Future Enhancements**:

- [ ] Notification microservice
- [ ] E2E & integration tests
- [ ] RBAC (role-based access control)
- [ ] OAuth 2.0
- [ ] CI/CD pipelines
