import { OpenAPIHono } from '@hono/zod-openapi'

export const createOpenApiHono = (): OpenAPIHono =>
  new OpenAPIHono({
    defaultHook: (result) => {
      // Laisse la ZodError remonter jusqu'à onError (errorHandler.ts) qui produit
      // le VALIDATION_ERROR structuré partagé. Sans ce hook, zod-openapi renvoie
      // un { success:false, error:{ name, message } } non typé.
      if (!result.success) throw result.error
    },
  })
