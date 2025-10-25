import type { z } from '@hono/zod-openapi'

/**
 * @fileoverview Type definitions for Zod schemas used throughout the application
 * This file defines the ZodSchema type which represents the various Zod schema types
 * that can be used in the application for validation and OpenAPI documentation.
 */

/**
 * Represents a union of common Zod schema types that can be used for validation
 * and OpenAPI documentation generation.
 *
 * This type includes:
 * - ZodUnion: For union type schemas
 * - ZodObject: For object schemas
 * - ZodArray: For array schemas containing Zod objects
 */
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
