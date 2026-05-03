// Shim that exports the CDN-loaded Pusher global
// This file is used as a Vite alias for 'pusher-js' so that
// laravel-echo's internal require('pusher-js') uses the CDN version
// instead of the broken npm-bundled version

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Pusher = (window as any).Pusher

export default Pusher
export { Pusher }
