import type { z } from '@hono/zod-openapi'

export type ZodSchema = z.ZodUnion<any> | z.ZodObject<any> | z.ZodArray<z.ZodObject<any>>

// export type ZodSchema = z.ZodUnion<any> | z.ZodType | z.ZodArray<z.ZodType>;

// export type ZodSchema =
//   | z.ZodObject<any>              // Object schemas
//   | z.ZodArray<any>               // Array schemas
//   | z.ZodUnion<any>               // Union types
//   | z.ZodOptional<any>            // Optional fields
//   | z.ZodNullable<any>            // Nullable fields
//   | z.ZodString                   // String fields
//   | z.ZodNumber                   // Number fields
//   | z.ZodBoolean                  // Boolean fields
//   | z.ZodEnum<any>                // Enum types
//   | z.ZodLiteral<any>             // Literal values
//   | z.ZodRecord<any>              // Record/dictionary types
//   | z.ZodIntersection<any, any>;  // Intersection types

// Simpler, more general approach
// export type ZodSchema = z.ZodType;
