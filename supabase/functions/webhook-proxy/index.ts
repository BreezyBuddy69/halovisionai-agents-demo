import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, webhookUrl } = await req.json();

    if (!messages || !webhookUrl) {
      return new Response(JSON.stringify({ error: "Missing messages or webhookUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedPrefixes = [
      "https://n8n.halo-vision.com/webhook/",
    ];
    const isAllowed = allowedPrefixes.some((p) => webhookUrl.startsWith(p));
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: "Webhook URL not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const contentType = webhookRes.headers.get("content-type") || "";
    let data: unknown;

    if (contentType.includes("application/json")) {
      data = await webhookRes.json();
    } else {
      data = await webhookRes.text();
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
