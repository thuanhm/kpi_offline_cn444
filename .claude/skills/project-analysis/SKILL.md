---
name: project-analysis
description: Use when asked to understand, map, onboard to, analyze, or assess an entire codebase or repository before making changes.
---

# Project Analysis

Build a repository map before proposing changes.

## Procedure
1. Inspect root files and directories.
2. Identify language, framework, package manager, build system, runtime, database, external services, and deployment model.
3. Inspect package manifests and lockfiles.
4. Find application entry points, routes, controllers, services, repositories, UI modules, shared libraries, jobs, migrations, tests, and configuration.
5. Identify architecture boundaries and dependency direction.
6. Locate authentication, authorization, validation, error handling, logging, caching, queues, storage, and observability.
7. Inspect CI/CD and production configuration.
8. Identify suspicious duplication, dead paths, oversized modules, circular dependencies, and undocumented contracts.
9. Run safe read-only checks when available.

## Output
Produce:
- stack inventory
- architecture map
- critical execution flows
- data/API boundaries
- test/build commands
- risk hotspots
- recommended next actions

Do not edit files during analysis unless explicitly requested.

## Ngôn ngữ bắt buộc

- Phản hồi người dùng bằng tiếng Việt.
- Báo cáo, finding, explanation, plan và recommendation phải bằng tiếng Việt.
- Giữ nguyên technical terms phổ biến bằng English khi cần.
- Không dịch code, identifier, package name, API route, database name, CLI command, log hoặc error message.
