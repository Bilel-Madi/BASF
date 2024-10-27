// // src/hooks.server.ts
// import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
// import { createServerClient } from '@supabase/ssr'
// import { type Handle, redirect, error } from '@sveltejs/kit'

// // Initialize the server-side hook for handling requests and responses.
// export const handle: Handle = async ({ event, resolve }) => {
//   // Creating a Supabase client for server-side operations using environment variables.
//   event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
//     cookies: {
//       // Helper functions for cookie management.
//       get: (key) => event.cookies.get(key),
//       set: (key, value, options) => {
//         event.cookies.set(key, value, options)
//       },
//       remove: (key, options) => {
//         event.cookies.delete(key, options)
//       },
//     },
//   })

//   // Helper function to retrieve the current session from Supabase auth.
//   event.locals.getSession = async () => {
//     const {
//       data: { session },
//     } = await event.locals.supabase.auth.getSession()
//     return session
//   }

//   // Check if the request is for a route starting with '/App'. This is a protected route.
//   if (event.url.pathname.startsWith('/App')) {
//     const session = await event.locals.getSession()
//     // If there is no session, the user is not signed in, so redirect to the home page.
//     if (!session) {
//       throw redirect(303, '/')
//     }
//   }

//   // Continue processing the request and customize the response.
//   return resolve(event, {
//     // Filter specific response headers, in this case, 'content-range'.
//     filterSerializedResponseHeaders(name) {
//       return name === 'content-range'
//     },
//   })
// }
