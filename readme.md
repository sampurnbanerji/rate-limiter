# Express Rate Limiter Middleware with Redis

This project implements a rate-limiting middleware for an Express.js application using TypeScript and Redis. The middleware tracks requests per IP address over a specified time frame and enforces rate limits. When the limit is exceeded, it returns an HTTP 429 (Too Many Requests) error. The project also supports temporary rate limit overrides and a sliding log algorithm for more granular control.

## Features

- Rate limiting based on IP address
- Sliding log algorithm for accurate request counting
- Temporary rate limit overrides
- Different rate limits for authenticated and unauthenticated users
- Unit tests with Jest

## Requirements

- Node.js
- npm or yarn
- Redis server

## For installation
- npm install

## To start the project use
- npm run start

## For running the test cases
- npm run test