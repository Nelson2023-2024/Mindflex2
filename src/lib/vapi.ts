import Vapi from "@vapi-ai/web"

console.log("VAPI API Key from env:", process.env.NEXT_PUBLIC_VAPI_API_KEY);
export const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!)