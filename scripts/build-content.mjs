// Set production mode before Velite loads the config, on Windows and Unix alike.
process.env.NODE_ENV = "production";
const { build } = await import("velite");
await build();
