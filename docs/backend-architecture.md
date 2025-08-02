# Convex Backend Architecture: Complete Technical Reference

Convex represents a fundamental departure from traditional REST API architecture, offering a reactive, function-based backend that eliminates the request-response paradigm in favor of real-time, transactional operations. This comprehensive guide provides the technical details needed to properly document Convex's unique architectural patterns.

## Core architectural philosophy: functions over endpoints

Convex replaces REST endpoints with **TypeScript functions** that execute within a reactive database environment. Unlike REST APIs that expose resources through HTTP methods, Convex uses three distinct function types that provide different capabilities and isolation guarantees.

**Queries** are pure, read-only functions that automatically create reactive subscriptions. When a client calls a query, it receives immediate results and ongoing updates whenever the underlying data changes. These functions must be deterministic and can only read from the database, providing **automatic caching** and **conflict-free concurrent execution**.

**Mutations** are transactional write functions that execute with full ACID guarantees. Every mutation runs as a single database transaction with **serializable isolation** - the strictest consistency level possible. The entire function either commits atomically or rolls back completely, with automatic retry on conflicts using optimistic concurrency control.

**Actions** handle non-deterministic operations like external API calls, email sending, or file processing. They interact with the database exclusively through queries and mutations, ensuring that all database operations maintain transactional guarantees even when integrated with external services.

This function-based architecture provides several advantages over REST:

- **End-to-end type safety** with automatic API generation
- **Real-time reactivity** without manual subscription management
- **Strong consistency** guarantees eliminating race conditions
- **Simplified state management** with automatic cache invalidation

## Convex Components: modular architecture without microservice complexity

Convex Components solve the modularity problem through **sandboxed, transactional building blocks** that combine the benefits of monolithic consistency with microservice modularity. Each component operates as a mini Convex backend with its own isolated database tables, functions, and resources.

**Isolation model**: Components maintain strict boundaries through multiple layers. Data isolation ensures components have completely separate database schemas with no cross-access without explicit APIs. Code isolation prevents components from accessing global variables or patching system behavior. Resource isolation provides independent scheduled functions and access controls per component.

**Transaction model**: Despite isolation, components participate in the same **serializable transaction system** as the main application. When a main app mutation calls component functions, all operations occur within the same atomic transaction. This eliminates distributed transaction complexity while maintaining modularity benefits.

**Integration patterns**: Components expose clean TypeScript APIs with full type safety. Installation involves adding components to `convex.config.ts`, running code generation, and using the automatically generated helper classes. Multiple instances of the same component can be installed with different configurations.

The component ecosystem includes sophisticated functionality like sharded counters, geospatial search, workflow management, rate limiting, and external service integrations. These components enable developers to add complex features without building them from scratch or managing separate services.

**Component advantages over traditional microservices**:

- **Transactional consistency** across component boundaries
- **Type-safe integration** with compile-time verification
- **Atomic deployment** with the main application
- **Unified debugging** and monitoring across all components
- **No network latency** between components and main app

## Real-time capabilities and WebSocket architecture

Convex implements real-time functionality through **persistent WebSocket connections** with automatic subscription management. Unlike traditional WebSocket implementations that require manual subscription lifecycle management, Convex automatically tracks query dependencies and pushes updates when relevant data changes.

**Reactive subscription model**: When a client executes a query, Convex tracks exactly what data the query reads (its "read set") and registers this with the subscription manager. When new transactions occur, the system automatically determines which queries are affected by comparing transaction write sets with active read sets. Affected queries are re-executed and updated results pushed to all subscribed clients.

**Consistency guarantees**: All subscribed queries update to the same logical timestamp, ensuring clients never see inconsistent data across different parts of their application. This eliminates the common problem in traditional real-time systems where different data sources update at different times.

**Communication architecture**: Clients connect to sync workers that manage WebSocket sessions and route messages to function runners. Function runners execute TypeScript code in V8 isolates, while a separate committer handles transaction commits and conflict resolution. This architecture provides **sub-millisecond latency** for cached queries and automatic scaling.

**Performance characteristics**: The subscription system efficiently handles thousands of concurrent clients by sharing computation for identical queries and walking the transaction log once to detect all overlapping changes. This scales better than traditional pub/sub systems that require separate channels for each type of update.

## Authentication and authorization patterns

Convex uses **OpenID Connect JWT tokens** for authentication, supporting integration with major authentication providers like Clerk, Auth0, and custom OIDC implementations. The system also includes Convex Auth, a built-in authentication library that runs directly on the Convex deployment.

**Provider integration**: Third-party authentication platforms provide JWT tokens that Convex validates using the provider's public keys. The integration pattern involves configuring the provider domain and application ID, then using provider-specific React components that wrap the Convex client.

**Authorization model**: Rather than imposing an opinionated framework like Row-Level Security, Convex enables flexible authorization through custom code in functions. Developers implement authorization checks using helper functions that verify user identity and permissions before executing operations.

**Role-based access control**: RBAC patterns involve storing role information in user documents and implementing permission checking functions that verify required access levels. The system supports hierarchical roles, organization-level permissions, and dynamic role assignment.

**Session management**: Convex handles JWT validation and provides user identity information through the `ctx.auth` context object. Sessions persist across WebSocket connections, and the system supports session invalidation through database operations.

## External service integration through HTTP Actions

HTTP Actions provide a bridge between Convex's function-based architecture and traditional REST APIs or webhook endpoints. These functions use the standard Fetch API `Request` and `Response` objects, enabling integration with existing HTTP-based services.

**HTTP routing**: The `httpRouter` supports traditional path-based routing with dynamic parameters, middleware, CORS handling, and standard HTTP methods. This enables Convex applications to expose REST endpoints when needed for external system integration.

**Webhook processing**: HTTP Actions excel at processing webhooks from external services. They can validate webhook signatures, parse payloads, and trigger appropriate database mutations while maintaining transactional guarantees.

**External API calls**: Actions can make outbound HTTP requests to external services using the full Node.js runtime environment. These operations don't have the determinism requirements of queries and mutations, enabling integration with third-party APIs, payment processors, and communication services.

**Integration architecture**: The typical pattern involves HTTP Actions receiving external events or API calls, processing the data, and updating the database through mutations. This maintains the separation between deterministic database operations and non-deterministic external interactions.

## File storage and upload patterns

Convex implements file storage through a **three-step upload process** that provides security and scalability. This approach separates upload authorization from the actual file transfer, enabling direct-to-storage uploads without exposing storage credentials.

**Upload process**: First, a mutation generates a signed upload URL with appropriate permissions and time limits. Second, the client uploads the file directly to the storage service using the signed URL. Third, another mutation saves the returned storage ID to the database, linking the file to the appropriate records.

**Storage integration**: Files are referenced in the database using storage IDs (typed as `v.id("_storage")`), which can be converted to download URLs when serving files to clients. The system supports unlimited file sizes through the signed URL approach, compared to the 20MB limit when uploading through HTTP Actions.

**Alternative patterns**: For smaller files or simpler use cases, HTTP Actions can handle direct uploads, though this requires CORS configuration and has size limitations. Components are available for integration with external storage services like Cloudflare R2.

## Function organization and project structure best practices

Effective Convex applications use a **layered architecture** that separates public API functions from business logic implementation. The recommended structure includes a thin API layer of public functions and a model layer containing the actual business logic.

**Organizational patterns**: The `convex/api/` directory contains short wrapper functions that expose the public interface, while `convex/model/` contains the business logic as plain TypeScript functions. This separation enables easier testing, reuse, and maintenance.

**Database abstraction**: Model functions provide a clean abstraction over database operations, implementing complex queries, validation, and business rules. API functions serve as thin wrappers that handle argument validation and call the appropriate model functions.

**Action organization**: Functions requiring Node.js runtime must be in separate files due to the module-level `"use node"` directive. Common patterns include suffix naming (e.g., `userNode.ts`) or dedicated action directories to prevent the "spaghetti code" problem where logic bounces between different function types.

**Schema design**: Relationship patterns include back-references for one-to-many relationships (using indexes for efficient queries), relationship tables for many-to-many associations, and direct references for limited one-to-one cases. The schema system supports evolution through optional fields and default values.

## Complex application architectures and production patterns

Production Convex applications demonstrate sophisticated architectural patterns that leverage the platform's unique capabilities. Real-world examples include AI-powered applications with complex workflow management, real-time collaborative tools, and e-commerce platforms with inventory management.

**AI application patterns**: Applications like HostAI use the Convex scheduler for complex async workflows, actions for LLM API integration, and the real-time system for interactive chat interfaces. The architecture enables building from MVP to production rapidly due to minimal infrastructure overhead.

**Migration patterns**: Production migrations to Convex often involve moving from traditional SQL databases to Convex's document-based system. The flexible schema and powerful query capabilities enable rapid migration with improved developer experience and reduced operational complexity.

**Performance optimization**: Production applications implement several optimization patterns including proper indexing strategies, pagination for large datasets, denormalization for read performance using aggregation components, and efficient relationship queries using back-references and junction tables.

**Testing strategies**: The `convex-test` library enables unit testing of functions with an in-memory database, while integration testing uses local Convex deployments. Production applications combine unit tests for core business logic with end-to-end tests using preview deployments.

**Deployment architecture**: Production Convex applications use Git-based deployments with automatic deployment from the main branch, preview deployments for testing changes, and shared development environments for team collaboration. The platform handles scaling automatically while providing monitoring and debugging tools.

## Key architectural advantages and considerations

Convex's architecture provides several fundamental advantages over traditional REST APIs and microservice architectures. The **reactive-by-default** model eliminates the need for manual state management and cache invalidation. **Strong consistency guarantees** prevent race conditions and data inconsistencies that plague distributed systems. **End-to-end type safety** reduces bugs and improves developer productivity.

**Performance benefits** include automatic caching with intelligent invalidation, optimized subscription management for real-time updates, and efficient query execution with proper indexing. The **transactional model** ensures data integrity even in complex workflows involving multiple operations.

**Developer experience advantages** include simplified deployment with no infrastructure management, comprehensive debugging tools with request tracing, and a unified platform that combines database, functions, file storage, and authentication.

**Architectural trade-offs** include learning curve differences from REST paradigms, platform-specific patterns that may require migration effort, and current limitations around multi-language support (primarily TypeScript/JavaScript).

## Conclusion

Convex represents a significant evolution in backend architecture, moving beyond REST APIs toward reactive, function-based systems with built-in real-time capabilities and strong consistency guarantees. The platform's combination of transactional functions, component-based modularity, and automatic real-time updates creates new possibilities for application architecture while significantly simplifying common development challenges.

For API documentation, this means abandoning REST-style endpoint documentation in favor of function-based documentation that emphasizes reactivity, type safety, and transactional behavior. The documentation should highlight how Convex's architecture eliminates common problems in distributed systems while providing superior developer experience through TypeScript integration and automatic infrastructure management.
