import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CODECHECKER_WEBHOOK = "https://n8n.halovisionai.cloud/webhook/codechecker-9413-4c88-8232-ab9ff53d4c9d";
const CODECHECKER_TEST_WEBHOOK = "https://n8n.halovisionai.cloud/webhook-test/codechecker-9413-4c88-8232-ab9ff53d4c9d";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, testMode } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: "Missing code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookUrl = testMode ? CODECHECKER_TEST_WEBHOOK : CODECHECKER_WEBHOOK;

    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const contentType = webhookRes.headers.get("content-type") || "";
    let data: unknown;

    if (contentType.includes("application/json")) {
      data = await webhookRes.json();
    } else {
      data = await webhookRes.text();
    }

    // Determine if the response indicates success
    let valid = false;
    let allowedAgents: string[] | "all" = [];

    if (typeof data === "string") {
      valid = data.toLowerCase().includes("true") || data.toLowerCase().includes("valid");
    } else if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (obj.valid !== undefined) valid = Boolean(obj.valid);
      else if (obj.success !== undefined) valid = Boolean(obj.success);
      else if (obj.result !== undefined) valid = String(obj.result).toLowerCase().includes("true");
      
      if (obj.allowedAgents) {
        allowedAgents = obj.allowedAgents as string[] | "all";
      }
    }

    // If no specific agents returned, default to "all" on valid
    if (valid && (!allowedAgents || (Array.isArray(allowedAgents) && allowedAgents.length === 0))) {
      allowedAgents = "all";
    }

    return new Response(JSON.stringify({ valid, allowedAgents }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Code checker error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
